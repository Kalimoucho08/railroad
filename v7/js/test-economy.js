/* test-economy.js — Verification logique economique V7 (Node) */
global.window = { RailBaron: {} };
global.RailBaron = global.window.RailBaron;
const gs = {
  cash: 1000000, startCash: 1000000, turn: 1, speed: 1,
  edges: [], routes: [], trains: [], stations: [], stocks: {}, log: [],
  economicState: 'normal', loans: [], financialHistory: [],
  _nextStationId: 0, _monthsInPeriod: 0, _nextEdgeId: 0, _nextTrainId: 0, _nextRouteId: 0,
  addLog(m) { this.log.unshift(m); },
  getNode(n) { return RB.findNode(n); },
  getEdgeById(id) { return this.edges.find(e => e.id === id); },
  edgeExists(a, b) { return this.edges.some(e => (e.a===a&&e.b===b)||(e.a===b&&e.b===a)); },
  get profit() { return this.cash - this.startCash; },
  get totalDebt() { return this.loans.reduce((s,l)=>s+l.amount,0); },
  get currentYear() { return 1890 + Math.floor((this.turn-1)/12); },
  get currentMonth() { return ((this.turn-1)%12)+1; },
  get maxTurns() { return 120; },
  get isFinished() { return false; },
  nextEdgeId() { return 'E'+(this._nextEdgeId++); },
  nextTrainId() { return 'T'+(this._nextTrainId++); },
  removeTrainsOnEdge(eid) { this.trains = this.trains.filter(t => t.edgeId !== eid); }
};

// Charger modules
require('/home/jdema/coding/railroad/v7/js/config.js');
require('/home/jdema/coding/railroad/v7/js/tracks.js');
require('/home/jdema/coding/railroad/v7/js/economy.js');
const RB = global.RailBaron;
RB.CONFIG.STARTING_CAPITAL = 1000000;

// Adapter les helpers
const origFind = RB.findNode;
RB.findNode = n => RB.CONFIG.NODES.find(x => x.name === n);
RB.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
RB.money = v => (v>=0?'':'') + '€' + Math.abs(Math.round(v)).toLocaleString('fr-FR');

let passed = 0, failed = 0;
function check(label, fn) {
  try { fn(); console.log('  OK  ', label); passed++; }
  catch(e) { console.log('  FAIL', label, '-', e.message); failed++; }
}

console.log('\n=== TEST ECONOMIE V7 ===\n');

// --- 1. Revenue formula ---
console.log('1. Formule revenu');
RB.Economy.init(gs);

const foret = RB.findNode('Foret des Ardennes');
const paris = RB.findNode('Paris');
const bassin = RB.findNode('Bassin Minier Nord');

check('Coal bulk ~300px', () => {
  const r = RB.Economy.revenuePerDelivery('coal', bassin, paris, 'limited', gs);
  if (r <= 0 || r > 50) throw new Error(`coal revenue ${r} hors plage (attendu ~17)`);
});

check('Mail long distance ~300px', () => {
  const r = RB.Economy.revenuePerDelivery('mail', paris, bassin, 'limited', gs);
  if (r < 3000 || r > 10000) throw new Error(`mail revenue ${r} hors plage (attendu ~6000)`);
});

check('Passengers limited bonus', () => {
  const r1 = RB.Economy.revenuePerDelivery('passengers', paris, bassin, 'limited', gs);
  if (r1 <= 0) throw new Error('passengers limited revenue 0');
});

// --- 2. Upkeep ---
console.log('\n2. Entretien');

// Ajouter une voie
gs.edges.push({ id: 'E0', a: 'Foret des Ardennes', b: 'Bassin Minier Nord', cost: 60, builtTurn: 1 });

check('Edge upkeep base', () => {
  const u = RB.Economy.monthlyUpkeep(gs);
  if (u < 5) throw new Error(`upkeep trop bas: ${u}`);
});

// Simuler vieillissement (5 ans)
gs.turn = 61; // 5 ans + 1 mois
check('Edge upkeep after 5 years', () => {
  const C = RB.CONFIG;
  C.TRACK_AGING = true;
  const u = RB.Economy.monthlyUpkeep(gs);
  // base 6 + 5 years * 1 = 11
  if (u < 10) throw new Error(`upkeep 5ans trop bas: ${u}`);
  C.TRACK_AGING = false;
  const uOff = RB.Economy.monthlyUpkeep(gs);
  if (uOff > 8) throw new Error(`upkeep aging OFF devrait etre bas: ${uOff}`);
});

// --- 3. Production chains ---
console.log('\n3. Chaines production');
RB.Economy.initStocks(gs);

check('Forest produces lumber', () => {
  if (gs.stocks['Foret des Ardennes']['lumber'] < 3) throw new Error('lumber stock initial bas');
});

check('City produces passengers', () => {
  if (gs.stocks['Paris']['passengers'] < 3) throw new Error('passengers initiaux bas');
});

RB.Economy.produceGoods(gs);
check('Monthly production added', () => {
  const after = gs.stocks['Foret des Ardennes']['lumber'];
  if (after < 4) throw new Error(`production mensuelle non ajoutee: ${after}`);
});

// --- 4. Cargo degradation ---
console.log('\n4. Degradation');
gs.stocks['Paris']['passengers'] = 10;
gs.stocks['Paris']['food'] = 5;
RB.Economy.degradeCargo(gs);
check('Passengers degrade', () => {
  if (gs.stocks['Paris']['passengers'] >= 10) throw new Error('passagers non degrades');
});
check('Coal does not degrade', () => {
  gs.stocks['Bassin Minier Nord']['coal'] = 10;
  RB.Economy.degradeCargo(gs);
  if (gs.stocks['Bassin Minier Nord']['coal'] !== 10) throw new Error('charbon degrade alors que non perissable');
});

// --- 5. Aging toggle ---
console.log('\n5. Toggle vieillissement');
const C = RB.CONFIG;
C.TRACK_AGING = false; C.TRAIN_AGING = false;
gs.turn = 120; // 10 ans
check('Aging OFF: upkeep constant', () => {
  const u = RB.Economy.monthlyUpkeep(gs);
  if (u > 15) throw new Error(`aging OFF mais upkeep eleve: ${u}`);
});

// --- 6. Economic cycle ---
console.log('\n6. Cycle economique');
gs.economicState = 'normal';
check('Normal state multipliers', () => {
  const eco = C.ECONOMIC_STATES.normal;
  if (eco.revenueMult !== 1.0) throw new Error('normal mult != 1.0');
});
check('Boom vs Depression difference', () => {
  const boom = C.ECONOMIC_STATES.boom.revenueMult;
  const dep = C.ECONOMIC_STATES.depression.revenueMult;
  if (boom <= dep) throw new Error(`boom(${boom}) <= depression(${dep})`);
});

console.log(`\n=== RESULTAT: ${passed} OK, ${failed} FAIL ===\n`);
process.exit(failed > 0 ? 1 : 0);

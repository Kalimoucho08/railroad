/* config.js — V5 : classes de fret, chaines de production, parametres */
const RailBaron = window.RailBaron || {};

RailBaron.CONFIG = {
  // --- Parametres globaux ---
  STARTING_CAPITAL: 1000000,
  MAX_GAME_YEARS: 10,
  MONTH_DURATION_MS: 10000,
  ACCOUNTING_PERIOD_YEARS: 2,    // periode comptable en annees
  START_YEAR: 1890,
  MAX_LOG_ENTRIES: 80,
  CANVAS_WIDTH: 1120,
  CANVAS_HEIGHT: 700,
  NODE_HIT_RADIUS: 18,
  TICK_MS: 16,

  // --- Emprunts ---
  LOAN_AMOUNT: 500000,
  BASE_INTEREST_RATE: 0.05,     // 5% en economie normale

  // --- Monnaie ---
  CURRENCY: '€',

  // --- Anciennes constantes (compatibilite) ---
  DEMOLITION_REFUND_RATIO: 0.25,
  EDGE_COST_PER_PX: 0.1,
  EDGE_COST_BASE: 25,
  BASE_SPEED: 0.0011,
  SPEED_VARIANCE: 0.0004,
  MAX_STOCK: 20,

  // --- Trains ---
  TRAIN_COST: 50000,
  WAGON_COST: 5000,
  SELL_REFUND_RATIO: 0.5,
  MAX_WAGONS: 6,
  PASSENGER_MAX_WAGONS: 4,
  LOAD_TIME: 380,
  UNLOAD_TIME: 330,
  TRAIN_UPKEEP_BASE: 20,
  TRAIN_UPKEEP_PER_WAGON: 5,

  // =============================================
  // CLASSES DE FRET (5)
  // =============================================
  CARGO_CLASSES: {
    mail:          { label: 'Courrier',    distSens: 1.5, speedSens: 1.5 },
    passengers:    { label: 'Passagers',   distSens: 1.3, speedSens: 1.3 },
    fast_freight:  { label: 'Fret rapide', distSens: 1.0, speedSens: 1.0 },
    slow_freight:  { label: 'Fret lent',   distSens: 0.6, speedSens: 0.5 },
    bulk_freight:  { label: 'Vrac',        distSens: 0.3, speedSens: 0.2 }
  },

  // =============================================
  // CARGAISONS (ressources transportables)
  // =============================================
  CARGO: {
    mail:       { label: 'Courrier',    class: 'mail',          baseRate: 600, color: '#e8d44d', perishable: true,  decayRate: 2 },
    passengers: { label: 'Passagers',   class: 'passengers',    baseRate: 450, color: '#7fd0d8', perishable: true,  decayRate: 2 },
    goods:      { label: 'Biens',       class: 'fast_freight',  baseRate: 300, color: '#e8903a', perishable: false, decayRate: 0 },
    food:       { label: 'Nourriture',  class: 'fast_freight',  baseRate: 270, color: '#8cc63f', perishable: true,  decayRate: 1 },
    steel:      { label: 'Acier',       class: 'slow_freight',  baseRate: 225, color: '#9aa4ad', perishable: false, decayRate: 0 },
    textiles:   { label: 'Textile',     class: 'slow_freight',  baseRate: 210, color: '#b65d8f', perishable: false, decayRate: 0 },
    grain:      { label: 'Grain',       class: 'slow_freight',  baseRate: 180, color: '#c9a845', perishable: false, decayRate: 0 },
    lumber:     { label: 'Bois',        class: 'bulk_freight',  baseRate: 150, color: '#6e4a24', perishable: false, decayRate: 0 },
    coal:       { label: 'Charbon',     class: 'bulk_freight',  baseRate: 120, color: '#2f2f32', perishable: false, decayRate: 0 },
    iron_ore:   { label: 'Minerai fer', class: 'bulk_freight',  baseRate: 135, color: '#8b4513', perishable: false, decayRate: 0 },
    oil:        { label: 'Petrole',     class: 'bulk_freight',  baseRate: 165, color: '#1a1a2e', perishable: false, decayRate: 0 },
    petroleum:  { label: 'Carburant',   class: 'bulk_freight',  baseRate: 240, color: '#16213e', perishable: false, decayRate: 0 }
  },

  // Alias legacy pour compatibilite
  RESOURCES: {
    charbon:   { label: 'Charbon',   color: '#2f2f32', base: 30 },
    bois:      { label: 'Bois',      color: '#6e4a24', base: 24 },
    grain:     { label: 'Grain',     color: '#c9a845', base: 22 },
    acier:     { label: 'Acier',     color: '#9aa4ad', base: 48 },
    textile:   { label: 'Textile',   color: '#b65d8f', base: 44 },
    passagers: { label: 'Passagers', color: '#7fd0d8', base: 36 }
  },

  // =============================================
  // CHAINES DE PRODUCTION
  // input_a + input_b → industry → output
  // =============================================
  PRODUCTION_CHAINS: [
    { inputs: ['coal', 'iron_ore'], industry: 'steel_mill',  output: 'steel',     ratio: 2 },
    { inputs: ['steel'],            industry: 'factory',     output: 'goods',     ratio: 1 },
    { inputs: ['grain'],            industry: 'food_plant',  output: 'food',      ratio: 1 },
    { inputs: ['lumber'],           industry: 'sawmill',     output: 'goods',     ratio: 1 },
    { inputs: ['oil'],              industry: 'refinery',    output: 'petroleum', ratio: 1 }
  ],

  // =============================================
  // CYCLE ECONOMIQUE
  // =============================================
  ECONOMIC_STATES: {
    boom:       { label: 'Boom',        revenueMult: 1.50, prodMult: 1.5, interestRate: 0.03 },
    prosperity: { label: 'Prosperite',  revenueMult: 1.25, prodMult: 1.2, interestRate: 0.04 },
    normal:     { label: 'Normal',      revenueMult: 1.00, prodMult: 1.0, interestRate: 0.05 },
    recession:  { label: 'Recession',   revenueMult: 0.80, prodMult: 0.7, interestRate: 0.07 },
    depression: { label: 'Depression',  revenueMult: 0.50, prodMult: 0.4, interestRate: 0.10 }
  },

  // =============================================
  // STATIONS
  // =============================================
  STATION_SIZES: {
    depot:    { label: 'Depot',    cost: 50000,  radius: 3,  capacity: 12,  color: '#a0a0a0' },
    station:  { label: 'Gare',     cost: 100000, radius: 4,  capacity: 20,  color: '#d4a84b' },
    terminal: { label: 'Terminal', cost: 200000, radius: 5,  capacity: 36,  color: '#e8c861' }
  },

  STATION_UPGRADES: {
    engine_shop:      { label: 'Atelier locom.', cost: 100000, desc: 'Permet de construire des trains' },
    switching_yard:   { label: 'Voie de triage', cost: 50000,  desc: 'Chargement 75% plus rapide' },
    maintenance_shop: { label: 'Atelier entret.', cost: 25000,  desc: 'Entretien -75% pour trains passants' },
    cold_storage:     { label: 'Entrepot frigo', cost: 25000,  desc: 'Nourriture ne se degrade pas' },
    post_office:      { label: 'Bureau de poste', cost: 50000, desc: 'Courrier ne se degrade pas' },
    restaurant:       { label: 'Restaurant',     cost: 25000,  desc: 'Revenu passagers +15%' },
    hotel:            { label: 'Hotel',          cost: 100000, desc: 'Revenu passagers +25%' }
  },

  // =============================================
  // CARTE : industries et villes
  // =============================================
  NODES: [
    // Villes (produisent passagers + mail, consomment biens finis)
    { name: 'Lille',              x: 170, y: 120, type: 'city', consumes: ['goods','food','steel'],                 pop: 3 },
    { name: 'Rouen',              x: 320, y: 170, type: 'city', consumes: ['goods','food','steel','textiles'],      pop: 2 },
    { name: 'Paris',              x: 470, y: 180, type: 'city', consumes: ['goods','food','steel','textiles','petroleum'], pop: 5 },
    { name: 'Nancy',              x: 670, y: 160, type: 'city', consumes: ['goods','steel','textiles'],             pop: 2 },
    { name: 'Lyon',               x: 620, y: 360, type: 'city', consumes: ['goods','food','steel','textiles'],      pop: 4 },
    { name: 'Nantes',             x: 220, y: 360, type: 'city', consumes: ['goods','food','textiles'],              pop: 2 },
    { name: 'Bordeaux',           x: 250, y: 530, type: 'city', consumes: ['goods','food','steel'],                 pop: 2 },
    { name: 'Marseille',          x: 760, y: 540, type: 'city', consumes: ['goods','food','steel','textiles'],      pop: 4 },

    // Producteurs de matieres premieres
    { name: 'Foret des Ardennes', x: 520, y: 70,  type: 'producer', produces: 'lumber',    prodRate: 3 },
    { name: 'Bassin Minier Nord', x: 760, y: 90,  type: 'producer', produces: 'coal',      prodRate: 4 },
    { name: 'Plaine de Beauce',   x: 390, y: 300, type: 'producer', produces: 'grain',     prodRate: 4 },
    { name: 'Mine de fer Est',    x: 920, y: 180, type: 'producer', produces: 'iron_ore',  prodRate: 3 },
    { name: 'Port Atlantique',    x: 110, y: 500, type: 'producer', produces: 'oil',       prodRate: 3 },

    // Industries de transformation
    { name: 'Hauts Fourneaux',    x: 860, y: 260, type: 'steel_mill',   consumes: ['coal','iron_ore'],  produces: 'steel',     prodRate: 1.5 },
    { name: 'Usine du Nord',      x: 580, y: 130, type: 'factory',      consumes: ['steel'],            produces: 'goods',     prodRate: 2.0 },
    { name: 'Filature du Midi',   x: 860, y: 430, type: 'factory',      consumes: ['steel'],            produces: 'goods',     prodRate: 1.5 },
    { name: 'Scierie Alpine',     x: 700, y: 300, type: 'sawmill',      consumes: ['lumber'],           produces: 'goods',     prodRate: 1.5 }
  ],

  // Couleurs par type de noeud
  NODE_COLORS: {
    city:       '#f0d37a',
    producer:   '#6e4a24',
    steel_mill: '#9aa4ad',
    factory:    '#e8903a',
    sawmill:    '#8cc63f',
    food_plant: '#c9a845',
    refinery:   '#16213e'
  }
};

// --- Utilitaires ---
RailBaron.findNode = name => RailBaron.CONFIG.NODES.find(n => n.name === name);
RailBaron.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
RailBaron.money = v => {
  const sign = v >= 0 ? '' : '-';
  return sign + RailBaron.CONFIG.CURRENCY + Math.abs(Math.round(v)).toLocaleString('fr-FR');
};

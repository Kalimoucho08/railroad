/* economy.js — V5 : classes de fret, chaines production, cycles eco */
RailBaron.Economy = {

  // --- Initialisation ---
  init(gs) {
    gs.economicState = 'normal';
    gs.loans = [];
    gs.stations = [];
    gs._nextStationId = 0;
    gs._monthsInPeriod = 0;
    this.initStocks(gs);
  },

  initStocks(gs) {
    const cargoes = Object.keys(RailBaron.CONFIG.CARGO);
    for (const node of RailBaron.CONFIG.NODES) {
      gs.stocks[node.name] = {};
      for (const c of cargoes) { gs.stocks[node.name][c] = 0; }
      if (node.type === 'producer' && node.produces) {
        gs.stocks[node.name][node.produces] = 4 + Math.floor(Math.random() * 4);
      }
      if (node.type !== 'city' && node.type !== 'producer' && node.produces) {
        gs.stocks[node.name][node.produces] = 2 + Math.floor(Math.random() * 3);
      }
      if (node.type === 'city') {
        gs.stocks[node.name]['passengers'] = (node.pop || 2) * 2 + Math.floor(Math.random() * 4);
        gs.stocks[node.name]['mail'] = (node.pop || 2) + Math.floor(Math.random() * 3);
      }
    }
  },

  // --- Production mensuelle ---
  produceGoods(gs) {
    const C = RailBaron.CONFIG;
    const ecoMult = C.ECONOMIC_STATES[gs.economicState].prodMult;

    for (const node of C.NODES) {
      const stocks = gs.stocks[node.name];
      if (node.type === 'producer' && node.produces) {
        const amt = Math.floor(node.prodRate * ecoMult) + (Math.random() < 0.4 ? 1 : 0);
        stocks[node.produces] = Math.min(C.MAX_STOCK, (stocks[node.produces] || 0) + amt);
      }
      if (node.type === 'city') {
        const pop = node.pop || 2;
        stocks['passengers'] = Math.min(C.MAX_STOCK, (stocks['passengers'] || 0) + Math.floor(pop * 1.5 * ecoMult) + (Math.random() < 0.5 ? 1 : 0));
        stocks['mail'] = Math.min(C.MAX_STOCK, (stocks['mail'] || 0) + Math.floor(pop * 0.8 * ecoMult) + (Math.random() < 0.4 ? 1 : 0));
      }
      this._processIndustry(node, gs);
    }
  },

  // --- Transformation industrielle ---
  _processIndustry(node, gs) {
    const C = RailBaron.CONFIG;
    if (node.type === 'city' || node.type === 'producer') return;
    const chain = C.PRODUCTION_CHAINS.find(ch => ch.industry === node.type);
    if (!chain) return;
    const stocks = gs.stocks[node.name];
    const ecoMult = C.ECONOMIC_STATES[gs.economicState].prodMult;
    let canProduce = true;
    for (const input of chain.inputs) {
      if ((stocks[input] || 0) < 1) { canProduce = false; break; }
    }
    if (!canProduce) return;
    for (const input of chain.inputs) stocks[input] = Math.max(0, stocks[input] - 1);
    const out = Math.max(1, Math.floor(chain.ratio * (node.prodRate || 1) * ecoMult));
    stocks[chain.output] = Math.min(C.MAX_STOCK, (stocks[chain.output] || 0) + out);
  },

  // --- Degradation cargaisons perissables ---
  degradeCargo(gs) {
    const C = RailBaron.CONFIG;
    for (const node of C.NODES) {
      const stocks = gs.stocks[node.name];
      const st = gs.stations.find(s => s.nodeName === node.name);
      for (const [key, def] of Object.entries(C.CARGO)) {
        if (!def.perishable || !stocks[key] || stocks[key] <= 0) continue;
        let prot = false;
        if (st && st.upgrades) {
          if (key === 'food' && st.upgrades.cold_storage) prot = true;
          if (key === 'mail' && st.upgrades.post_office) prot = true;
        }
        if (!prot) stocks[key] = Math.max(0, stocks[key] - def.decayRate);
      }
    }
  },

  // --- Formule de revenu par wagon livre ---
  // R = BaseRate × f(distance, class) × g(speed, class) × EcoMult × StationMult
  revenuePerDelivery(cargoKey, fromNode, toNode, trainType, gs) {
    const C = RailBaron.CONFIG;
    const cargo = C.CARGO[cargoKey];
    if (!cargo) return 0;
    const cls = C.CARGO_CLASSES[cargo.class];
    const dist = RailBaron.dist(fromNode, toNode);

    // f(distance) : (1 + dist/K) × sens avec K variable par classe
    let distFactor;
    switch (cargo.class) {
      case 'mail':        distFactor = (1 + dist / 120) * cls.distSens; break;
      case 'passengers':  distFactor = (1 + dist / 150) * cls.distSens; break;
      case 'fast_freight': distFactor = (1 + dist / 200) * cls.distSens; break;
      case 'slow_freight': distFactor = (1 + dist / 280) * cls.distSens; break;
      case 'bulk_freight':
      default:            distFactor = (1 + dist / 350) * cls.distSens; break;
    }

    // g(speed) — ratio vitesse train / vitesse base
    let speedFactor = cls.speedSens * 1.0;
    if (trainType === 'limited') speedFactor *= 1.25;

    const ecoMult = C.ECONOMIC_STATES[gs.economicState].revenueMult;

    // Station double rate
    let stationMult = 1.0;
    const fromSt = gs.stations.find(s => s.nodeName === fromNode.name);
    if (fromSt && fromSt.doubleRateUntil && fromSt.doubleRateUntil > gs.turn) stationMult = 2.0;

    // Bonus passagers
    let paxBonus = 1.0;
    if (cargoKey === 'passengers') {
      const toSt = gs.stations.find(s => s.nodeName === toNode.name);
      if (toSt && toSt.upgrades) {
        if (toSt.upgrades.hotel) paxBonus += 0.25;
        else if (toSt.upgrades.restaurant) paxBonus += 0.15;
      }
    }

    return Math.round(cargo.baseRate * distFactor * speedFactor * ecoMult * stationMult * paxBonus);
  },

  // --- Cout entretien mensuel ---
  monthlyUpkeep(gs) {
    const C = RailBaron.CONFIG;
    let total = gs.edges.length * 6;
    for (const st of gs.stations) {
      total += st.size === 'depot' ? 200 : st.size === 'station' ? 400 : 800;
    }
    for (const train of gs.trains) {
      if (train.status === 'paused') continue;  // aucun cout
      const mul = train.status === 'on_demand' ? 0.5 : 1.0;
      total += Math.round((C.TRAIN_UPKEEP_BASE + train.maxWagons * C.TRAIN_UPKEEP_PER_WAGON) * mul);
    }
    return total;
  },

  monthlyInterest(gs) {
    let total = 0;
    for (const loan of gs.loans) total += loan.amount * loan.rate / 12;
    return Math.round(total);
  },

  // --- Fin de mois ---
  processMonthEnd(gs) {
    const C = RailBaron.CONFIG;
    const year = C.START_YEAR + Math.floor((gs.turn - 1) / 12);
    const month = ((gs.turn - 1) % 12) + 1;

    // Snapshot financier avant de vider les compteurs
    let totalRevenue = 0;
    const trainSnaps = [];
    for (const t of gs.trains) {
      totalRevenue += t.monthlyRevenue;
      trainSnaps.push({
        id: t.id, resource: t.resource, from: t.from, to: t.to,
        revenue: t.monthlyRevenue, deliveries: t.deliveriesThisMonth || 0, status: t.status
      });
      t.monthlyRevenue = 0;
      t.deliveriesThisMonth = 0;
    }
    const upkeep = this.monthlyUpkeep(gs);
    const interest = this.monthlyInterest(gs);
    const net = totalRevenue - upkeep - interest;

    // Stocker snapshot
    if (!gs.financialHistory) gs.financialHistory = [];
    gs.financialHistory.push({
      turn: gs.turn, year, month, revenue: totalRevenue, upkeep, interest, net, trains: trainSnaps
    });
    if (gs.financialHistory.length > 24) gs.financialHistory.shift();

    gs.cash += net;
    gs.turn++;
    gs._monthsInPeriod++;

    gs.addLog(`${String(month).padStart(2,'0')}/${year} : +${RailBaron.money(totalRevenue)} rec, -${RailBaron.money(upkeep)} ent, -${RailBaron.money(interest)} int = ${RailBaron.money(net)}`);

    if (gs.turn > C.MAX_GAME_YEARS * 12) {
      gs.addLog(`Fin simulation (${C.MAX_GAME_YEARS} ans). Benefice total : ${RailBaron.money(gs.profit)}.`);
      gs.speed = 0;
      return;
    }
    if (gs.cash < -500000) {
      gs.addLog('FAILLITE ! Dettes insoutenables.');
      gs.speed = 0;
      return;
    }

    this.produceGoods(gs);
    this.degradeCargo(gs);

    // Cycle eco : transition possible chaque fin de periode comptable
    if (gs._monthsInPeriod >= C.ACCOUNTING_PERIOD_YEARS * 12) {
      gs._monthsInPeriod = 0;
      this._maybeChangeEconomicState(gs);
      for (const st of gs.stations) {
        if (st.doubleRateUntil && st.doubleRateUntil <= gs.turn) st.doubleRateUntil = 0;
      }
    }
  },

  _maybeChangeEconomicState(gs) {
    const states = ['depression', 'recession', 'normal', 'prosperity', 'boom'];
    const idx = states.indexOf(gs.economicState);
    const trend = gs.profit > 0 ? 0.15 : -0.15;
    const roll = Math.random() + trend;
    if (roll > 0.65 && idx < 4) {
      gs.economicState = states[idx + 1];
      gs.addLog(`Climat eco : ${RailBaron.CONFIG.ECONOMIC_STATES[gs.economicState].label}.`);
    } else if (roll < 0.25 && idx > 0) {
      gs.economicState = states[idx - 1];
      gs.addLog(`Climat eco : ${RailBaron.CONFIG.ECONOMIC_STATES[gs.economicState].label}.`);
    }
  },

  // --- Emprunt ---
  takeLoan(gs) {
    const C = RailBaron.CONFIG;
    const rate = C.ECONOMIC_STATES[gs.economicState].interestRate;
    gs.loans.push({ amount: C.LOAN_AMOUNT, rate, issueTurn: gs.turn });
    gs.cash += C.LOAN_AMOUNT;
    gs.addLog(`Emprunt ${RailBaron.money(C.LOAN_AMOUNT)} (taux ${(rate*100).toFixed(0)}%).`);
    return true;
  },

  repayLoan(gs, loanIndex) {
    if (loanIndex < 0 || loanIndex >= gs.loans.length) return false;
    const loan = gs.loans[loanIndex];
    if (gs.cash < loan.amount) { gs.addLog('Capital insuffisant.'); return false; }
    gs.cash -= loan.amount;
    gs.addLog(`Emprunt ${RailBaron.money(loan.amount)} rembourse.`);
    gs.loans.splice(loanIndex, 1);
    return true;
  },

  // --- Station ---
  buildStation(gs, nodeName, size) {
    const C = RailBaron.CONFIG;
    const def = C.STATION_SIZES[size];
    if (!def) return null;
    if (gs.cash < def.cost) { gs.addLog(`Capital insuffisant (${RailBaron.money(def.cost)}).`); return null; }
    if (gs.stations.find(s => s.nodeName === nodeName)) { gs.addLog('Station deja existante.'); return null; }
    gs.cash -= def.cost;
    const st = {
      id: 'S' + (gs._nextStationId++), nodeName, size,
      builtTurn: gs.turn,
      doubleRateUntil: gs.turn + C.ACCOUNTING_PERIOD_YEARS * 12,
      upgrades: {}
    };
    gs.stations.push(st);
    gs.addLog(`${def.label} a ${nodeName} (${RailBaron.money(def.cost)}). Tarifs doubles ${C.ACCOUNTING_PERIOD_YEARS} ans.`);
    return st;
  },

  addUpgrade(gs, stationId, upgradeKey) {
    const C = RailBaron.CONFIG;
    const st = gs.stations.find(s => s.id === stationId);
    if (!st) return false;
    if (st.upgrades[upgradeKey]) { gs.addLog('Deja installe.'); return false; }
    const upg = C.STATION_UPGRADES[upgradeKey];
    if (!upg) return false;
    if (gs.cash < upg.cost) { gs.addLog(`Capital insuffisant (${RailBaron.money(upg.cost)}).`); return false; }
    gs.cash -= upg.cost;
    st.upgrades[upgradeKey] = true;
    gs.addLog(`${upg.label} installe (${RailBaron.money(upg.cost)}).`);
    return true;
  }
};

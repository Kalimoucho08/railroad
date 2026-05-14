RailBaron.Economy = {
  initPrices(gs) {
    for (const [key, res] of Object.entries(RailBaron.CONFIG.RESOURCES)) {
      gs.prices[key] = this._rollPrice(gs.turn, res.base);
    }
  },

  updatePrices(gs) {
    for (const [key, res] of Object.entries(RailBaron.CONFIG.RESOURCES)) {
      gs.prices[key] = this._rollPrice(gs.turn, res.base);
    }
  },

  _rollPrice(turn, base) {
    return base + Math.round((Math.sin(turn + base) + 1) * 6 + Math.random() * 5);
  },

  initStocks(gs) {
    const resources = Object.keys(RailBaron.CONFIG.RESOURCES);
    for (const node of RailBaron.CONFIG.NODES) {
      gs.stocks[node.name] = {};
      for (const r of resources) {
        gs.stocks[node.name][r] = 0;
      }
      for (const r of node.produces) {
        gs.stocks[node.name][r] = 4 + Math.floor(Math.random() * 4);
      }
    }
  },

  produceGoods(gs) {
    const C = RailBaron.CONFIG;
    for (const node of C.NODES) {
      for (const r of node.produces) {
        const base = r === 'passagers' ? C.PASSENGER_PRODUCTION : C.BASE_PRODUCTION;
        const added = Math.floor(base * node.prodRate) + Math.floor(Math.random() * (C.PRODUCTION_VARIANCE + 1));
        gs.stocks[node.name][r] = Math.min(C.MAX_STOCK, gs.stocks[node.name][r] + added);
      }
    }
  },

  revenuePerWagon(train, gs) {
    const from = gs.getNode(train.from);
    const to = gs.getNode(train.to);
    const base = gs.prices[train.resource];
    const d = RailBaron.dist(from, to);
    const quality = Math.max(0.8, 1.9 - d / 700);
    const demandBonus = to.demands.includes(train.resource) ? 1.4 : 1.05;
    return Math.round(base * quality * demandBonus);
  },

  monthlyUpkeep(gs) {
    const C = RailBaron.CONFIG;
    return gs.edges.length * C.UPKEEP_PER_EDGE + gs.trains.length * C.UPKEEP_PER_TRAIN;
  },

  processMonthEnd(gs) {
    let totalRevenue = 0;
    for (const t of gs.trains) {
      totalRevenue += t.monthlyRevenue;
      t.monthlyRevenue = 0;
    }
    const upkeep = this.monthlyUpkeep(gs);
    const net = totalRevenue - upkeep;
    gs.cash += net;

    const month = gs.turn;
    gs.turn++;
    this.updatePrices(gs);

    gs.addLog(`Mois ${month} : recettes ${RailBaron.money(totalRevenue)}, entretien ${RailBaron.money(upkeep)}, net ${RailBaron.money(net)}.`);

    if (gs.isFinished) {
      gs.addLog(`Fin de partie ! Bénéfice total : ${RailBaron.money(gs.profit)}.`);
      gs.speed = 0;
    }

    this.produceGoods(gs);
  }
};

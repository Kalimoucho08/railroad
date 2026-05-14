/* trains.js — V5.5 : statuts (active/paused/on_demand), vente, visibilite */
RailBaron.Trains = {

  spawn(gs, edgeId, resource) {
    const edge = gs.getEdgeById(edgeId);
    if (!edge || !resource) { gs.addLog('Selection incomplete.'); return null; }
    const suitable = RailBaron.Tracks.getSuitableResources(edge, gs);
    if (!suitable.includes(resource)) { gs.addLog('Cette marchandise ne convient pas a cette ligne.'); return null; }
    const C = RailBaron.CONFIG;
    if (gs.cash < C.TRAIN_COST) { gs.addLog(`Capital insuffisant (cout train : ${RailBaron.money(C.TRAIN_COST)}).`); return null; }

    const a = gs.getNode(edge.a);
    const b = gs.getNode(edge.b);
    const aProd = RailBaron.Tracks._getProducesList(a);
    const bProd = RailBaron.Tracks._getProducesList(b);
    const from = aProd.includes(resource) ? a : bProd.includes(resource) ? b : a;
    const to = from.name === a.name ? b : a;

    const cargoDef = C.CARGO[resource];
    const maxW = resource === 'passengers' ? C.PASSENGER_MAX_WAGONS : C.MAX_WAGONS;

    gs.cash -= C.TRAIN_COST;
    const train = {
      id: gs.nextTrainId(), edgeId: edge.id, resource,
      cargoLabel: cargoDef ? cargoDef.label : resource,
      from: from.name, to: to.name,
      wagons: 0, maxWagons: maxW,
      trainType: 'limited',
      status: 'active',       // 'active' | 'paused' | 'on_demand'
      waitFull: false,
      progress: 0, state: 'loading', timer: 0,
      speed: C.BASE_SPEED + Math.random() * C.SPEED_VARIANCE,
      monthlyRevenue: 0, lifetimeProfit: 0,
      deliveriesThisMonth: 0
    };
    gs.trains.push(train);
    gs.addLog(`Convoi ${cargoDef ? cargoDef.label : resource} ${from.name} → ${to.name} (${RailBaron.money(C.TRAIN_COST)}).`);
    return train;
  },

  // --- Vente ---
  sellTrain(gs, trainId) {
    const idx = gs.trains.findIndex(t => t.id === trainId);
    if (idx === -1) return false;
    const C = RailBaron.CONFIG;
    const refund = Math.round(C.TRAIN_COST * C.SELL_REFUND_RATIO);
    gs.cash += refund;
    gs.addLog(`Train ${trainId} revendu (${RailBaron.money(refund)}). Profit total : ${RailBaron.money(gs.trains[idx].lifetimeProfit)}.`);
    gs.trains.splice(idx, 1);
    return true;
  },

  // --- Changement de statut ---
  setTrainStatus(gs, trainId, status) {
    const train = gs.trains.find(t => t.id === trainId);
    if (!train) return false;
    const labels = { active: 'Actif', paused: 'En pause', on_demand: 'A la demande' };
    train.status = status;
    if (status === 'paused') {
      train.state = 'loading';
      train.timer = 0;
    }
    gs.addLog(`Train ${trainId} : ${labels[status] || status}.`);
    return true;
  },

  // --- Boucle de mise a jour ---
  update(gs) {
    for (const train of gs.trains) {
      if (train.status === 'paused') continue;  // immobilise
      switch (train.state) {
        case 'loading':   this._stepLoading(train, gs);   break;
        case 'moving':    this._stepMoving(train);         break;
        case 'unloading': this._stepUnloading(train, gs);  break;
        case 'returning': this._stepReturning(train);      break;
      }
    }
  },

  _stepLoading(train, gs) {
    const C = RailBaron.CONFIG;
    train.timer += C.TICK_MS;
    const stock = gs.stocks[train.from][train.resource] || 0;

    if (train.timer > C.LOAD_TIME && train.wagons < train.maxWagons && stock > 0) {
      train.wagons++;
      gs.stocks[train.from][train.resource]--;
      train.timer = 0;
    }

    const shouldDepart = train.wagons === train.maxWagons ||
      (train.wagons > 0 && stock === 0) ||
      (train.wagons > 0 && train.status === 'on_demand');  // on_demand : part des qu'il a quelque chose

    if (shouldDepart && train.wagons > 0) {
      train.state = 'moving';
      train.timer = 0;
    }
  },

  _stepMoving(train) {
    const C = RailBaron.CONFIG;
    train.progress += train.speed * C.TICK_MS;
    if (train.progress >= 1) { train.progress = 1; train.state = 'unloading'; train.timer = 0; }
  },

  _stepUnloading(train, gs) {
    const C = RailBaron.CONFIG;
    train.timer += C.TICK_MS;
    if (train.timer > C.UNLOAD_TIME && train.wagons > 0) {
      train.wagons--;
      train.timer = 0;
      train.deliveriesThisMonth = (train.deliveriesThisMonth || 0) + 1;

      const fromNode = gs.getNode(train.from);
      const toNode = gs.getNode(train.to);
      const gain = RailBaron.Economy.revenuePerDelivery(train.resource, fromNode, toNode, train.trainType, gs);
      train.monthlyRevenue += gain;
      train.lifetimeProfit += gain;

      const destStocks = gs.stocks[train.to];
      const destNode = gs.getNode(train.to);
      const destAccepts = RailBaron.Tracks._getAcceptsList(destNode);
      if (!destAccepts.has(train.resource) && train.resource !== 'passengers' && train.resource !== 'mail') {
        destStocks[train.resource] = Math.min(C.MAX_STOCK, (destStocks[train.resource] || 0) + 1);
      }
    } else if (train.wagons === 0) {
      train.state = 'returning';
    }
  },

  _stepReturning(train) {
    const C = RailBaron.CONFIG;
    train.progress -= train.speed * C.TICK_MS;
    if (train.progress <= 0) { train.progress = 0; train.state = 'loading'; }
  }
};

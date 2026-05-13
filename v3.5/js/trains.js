RailBaron.Trains = {
  spawn(gs, edgeId, resource) {
    const edge = gs.getEdgeById(edgeId);
    if (!edge || !resource) {
      gs.addLog('Sélection incomplète.');
      return null;
    }
    const suitable = RailBaron.Tracks.getSuitableResources(edge, gs);
    if (!suitable.includes(resource)) {
      gs.addLog('Cette marchandise ne convient pas à cette ligne.');
      return null;
    }
    const C = RailBaron.CONFIG;
    if (gs.cash < C.TRAIN_COST) {
      gs.addLog('Capital insuffisant pour acheter un convoi.');
      return null;
    }

    const existing = gs.trains.filter(t => t.edgeId === edgeId && t.resource === resource);
    if (existing.length >= 2) {
      gs.addLog('Attention : ligne déjà saturée pour cette marchandise.');
    }

    gs.cash -= C.TRAIN_COST;
    const a = gs.getNode(edge.a);
    const b = gs.getNode(edge.b);
    const from = a.produces.includes(resource) ? a : b.produces.includes(resource) ? b : a;
    const to = from.name === a.name ? b : a;
    const maxWagons = resource === 'passagers' ? C.PASSENGER_MAX_WAGONS : C.DEFAULT_MAX_WAGONS;

    const train = {
      id: gs.nextTrainId(),
      edgeId: edge.id,
      resource,
      from: from.name,
      to: to.name,
      wagons: 0,
      maxWagons,
      progress: 0,
      state: 'loading',
      timer: 0,
      speed: C.BASE_SPEED + Math.random() * C.SPEED_VARIANCE,
      monthlyRevenue: 0,
      lifetimeProfit: 0
    };
    gs.trains.push(train);
    gs.addLog(`Convoi affecté : ${C.RESOURCES[resource].label} ${from.name} → ${to.name}.`);
    return train;
  },

  update(gs) {
    for (const train of gs.trains) {
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
    const stock = gs.stocks[train.from][train.resource];
    if (train.timer > C.LOAD_TIME && train.wagons < train.maxWagons && stock > 0) {
      train.wagons++;
      gs.stocks[train.from][train.resource]--;
      train.timer = 0;
    } else if (
      (train.wagons === train.maxWagons || (train.wagons > 0 && stock === 0)) &&
      train.wagons > 0
    ) {
      train.state = 'moving';
      train.timer = 0;
    }
  },

  _stepMoving(train) {
    const C = RailBaron.CONFIG;
    train.progress += train.speed * C.TICK_MS;
    if (train.progress >= 1) {
      train.progress = 1;
      train.state = 'unloading';
      train.timer = 0;
    }
  },

  _stepUnloading(train, gs) {
    const C = RailBaron.CONFIG;
    train.timer += C.TICK_MS;
    if (train.timer > C.UNLOAD_TIME && train.wagons > 0) {
      train.wagons--;
      train.timer = 0;
      const gain = RailBaron.Economy.revenuePerWagon(train, gs);
      train.monthlyRevenue += gain;
      train.lifetimeProfit += gain;
      const destNode = gs.getNode(train.to);
      if (!destNode.demands.includes(train.resource) && train.resource !== 'passagers') {
        gs.stocks[train.to][train.resource] = Math.min(C.MAX_STOCK, gs.stocks[train.to][train.resource] + 1);
      }
    } else if (train.wagons === 0) {
      train.state = 'returning';
    }
  },

  _stepReturning(train) {
    const C = RailBaron.CONFIG;
    train.progress -= train.speed * C.TICK_MS;
    if (train.progress <= 0) {
      train.progress = 0;
      train.state = 'loading';
    }
  }
};

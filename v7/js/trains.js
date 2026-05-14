/* trains.js — V7 : routes multi-arrets, consist multi-ressources */
RailBaron.Trains = {

  spawn(gs, routeId, consist, stopsAt) {
    const route = gs.routes.find(r => r.id === routeId);
    if (!route) { gs.addLog('Route introuvable.'); return null; }
    if (!consist || Object.keys(consist).length === 0) { gs.addLog('Le consist est vide.'); return null; }
    const C = RailBaron.CONFIG;
    const totalWagons = Object.values(consist).reduce((a, b) => a + b, 0);
    const cost = C.TRAIN_COST + totalWagons * C.WAGON_COST;
    if (gs.cash < cost) { gs.addLog(`Capital insuffisant (cout : ${RailBaron.money(cost)}).`); return null; }

    gs.cash -= cost;
    const train = {
      id: gs.nextTrainId(), routeId: route.id, consist: { ...consist },
      stopsAt: stopsAt || route.stops.map(() => true),
      wagonsLoaded: {}, currentStopIndex: 0, direction: 1,
      state: 'loading', progress: 0, timer: 0,
      trainType: 'limited', status: 'active',
      speed: C.BASE_SPEED + Math.random() * C.SPEED_VARIANCE,
      builtTurn: gs.turn,
      monthlyRevenue: 0, lifetimeProfit: 0, deliveriesThisMonth: 0
    };
    for (const r of Object.keys(train.consist)) train.wagonsLoaded[r] = 0;
    gs.trains.push(train);

    const cargoList = Object.entries(consist).map(([r, n]) => `${n}x${(C.CARGO[r] || {}).label || r}`).join(', ');
    gs.addLog(`Convoi ${train.id} : ${cargoList} sur ${route.name} (${RailBaron.money(cost)}).`);
    return train;
  },

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

  setTrainStatus(gs, trainId, status) {
    const train = gs.trains.find(t => t.id === trainId);
    if (!train) return false;
    const labels = { active: 'Actif', paused: 'En pause', on_demand: 'A la demande' };
    train.status = status;
    if (status === 'paused') { train.state = 'loading'; train.timer = 0; }
    gs.addLog(`Train ${trainId} : ${labels[status] || status}.`);
    return true;
  },

  update(gs) {
    for (const train of gs.trains) {
      if (train.status === 'paused') continue;
      const route = gs.routes.find(r => r.id === train.routeId);
      if (!route) continue;
      switch (train.state) {
        case 'loading':   this._stepLoading(train, route, gs);   break;
        case 'moving':    this._stepMoving(train, route);         break;
        case 'unloading': this._stepUnloading(train, route, gs); break;
      }
    }
  },

  _currentNode(train, route) {
    return RailBaron.findNode(route.stops[train.currentStopIndex]);
  },

  _nextIndex(train, route) {
    const ni = train.currentStopIndex + train.direction;
    if (ni >= route.stops.length || ni < 0) {
      train.direction *= -1;
      return train.currentStopIndex + train.direction;
    }
    return ni;
  },

  // === LOADING ===
  _stepLoading(train, route, gs) {
    const C = RailBaron.CONFIG;
    const nodeName = route.stops[train.currentStopIndex];
    const stocks = gs.stocks[nodeName];

    if (!train.stopsAt[train.currentStopIndex]) {
      train.state = 'moving'; train.timer = 0; train.progress = 0;
      return;
    }

    train.timer += C.TICK_MS * Math.max(1, gs.speed);

    for (const [r, maxW] of Object.entries(train.consist)) {
      const current = train.wagonsLoaded[r] || 0;
      const stock = stocks[r] || 0;
      if (current < maxW && stock > 0 && train.timer > C.LOAD_TIME) {
        train.wagonsLoaded[r] = current + 1;
        stocks[r]--;
        train.timer = 0;
        break;
      }
    }

    const totalLoaded = Object.values(train.wagonsLoaded).reduce((a, b) => (a || 0) + (b || 0), 0);
    const canLoadMore = Object.entries(train.consist).some(([r, maxW]) => {
      return (train.wagonsLoaded[r] || 0) < maxW && (stocks[r] || 0) > 0;
    });

    if (totalLoaded > 0 && (!canLoadMore || train.status === 'on_demand')) {
      train.state = 'moving'; train.progress = 0; train.timer = 0;
    } else if (totalLoaded === 0 && !canLoadMore) {
      train.state = 'moving'; train.progress = 0; train.timer = 0;
    }
  },

  // === MOVING ===
  _stepMoving(train, route) {
    const C = RailBaron.CONFIG;
    const curNode = this._currentNode(train, route);
    if (!curNode || train.currentStopIndex >= route.stops.length) {
      train.currentStopIndex = 0; train.state = 'loading'; return;
    }
    const nextIdx = this._nextIndex(train, route);
    const nextNode = RailBaron.findNode(route.stops[nextIdx]);
    if (!nextNode) { train.state = 'loading'; return; }
    const dist = RailBaron.dist(curNode, nextNode);

    const segmentTime = dist / (train.speed * 1000);
    if (segmentTime <= 0) { train.progress = 1; }
    else { train.progress += C.TICK_MS / segmentTime; }

    if (train.progress >= 1) {
      train.progress = 0;
      train.currentStopIndex = nextIdx;
      train.state = 'unloading';
      train.timer = 0;
    }
  },

  // === UNLOADING ===
  _stepUnloading(train, route, gs) {
    const C = RailBaron.CONFIG;
    const nodeName = route.stops[train.currentStopIndex];
    const node = gs.getNode(nodeName);
    const accepts = RailBaron.Tracks._getAcceptsList(node);

    if (!train.stopsAt[train.currentStopIndex]) {
      train.state = 'loading'; train.timer = 0;
      return;
    }

    train.timer += C.TICK_MS * Math.max(1, gs.speed);

    for (const [r, loaded] of Object.entries(train.wagonsLoaded)) {
      if (loaded > 0 && accepts.has(r) && train.timer > C.UNLOAD_TIME) {
        train.wagonsLoaded[r] = loaded - 1;
        train.timer = 0;
        train.deliveriesThisMonth = (train.deliveriesThisMonth || 0) + 1;

        const prevIdx = train.currentStopIndex - train.direction;
        const fromNodeName = (prevIdx >= 0 && prevIdx < route.stops.length) ? route.stops[prevIdx] : nodeName;
        const fromNode = gs.getNode(fromNodeName);
        const gain = RailBaron.Economy.revenuePerDelivery(r, fromNode, node, train.trainType, gs);
        train.monthlyRevenue += gain;
        train.lifetimeProfit += gain;
        break;
      }
    }

    const allEmpty = Object.values(train.wagonsLoaded).every(v => (v || 0) === 0);
    if (allEmpty) {
      train.state = 'loading'; train.timer = 0;
    } else {
      const canUnloadAny = Object.entries(train.wagonsLoaded).some(([r, loaded]) => loaded > 0 && accepts.has(r));
      if (!canUnloadAny && train.timer > C.UNLOAD_TIME * 2) {
        train.state = 'loading'; train.timer = 0;
      }
    }
  }
};

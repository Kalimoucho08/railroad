/* trains.js — V6 : routes multi-arrets, consist multi-ressources */
RailBaron.Trains = {

  // --- Achat ---
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
      id: gs.nextTrainId(),
      routeId: route.id,
      consist: { ...consist },           // { coal: 2, mail: 1 }
      stopsAt: stopsAt || route.stops.map(() => true),
      wagonsLoaded: {},                  // { coal: 0, mail: 0 }
      currentStopIndex: 0,
      direction: 1,
      state: 'loading',                  // loading | moving | unloading
      progress: 0,                       // 0→1 entre current et next stop
      timer: 0,
      trainType: 'limited',
      status: 'active',                  // active | paused | on_demand
      speed: C.BASE_SPEED + Math.random() * C.SPEED_VARIANCE,
      builtTurn: gs.turn,
      monthlyRevenue: 0,
      lifetimeProfit: 0,
      deliveriesThisMonth: 0
    };
    // Init wagonsLoaded a 0 pour chaque type
    for (const r of Object.keys(train.consist)) train.wagonsLoaded[r] = 0;
    gs.trains.push(train);

    const cargoList = Object.entries(consist).map(([r, n]) => `${n}x${(C.CARGO[r] || {}).label || r}`).join(', ');
    gs.addLog(`Convoi ${train.id} : ${cargoList} sur ${route.name} (${RailBaron.money(cost)}).`);
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

  // --- Statut ---
  setTrainStatus(gs, trainId, status) {
    const train = gs.trains.find(t => t.id === trainId);
    if (!train) return false;
    const labels = { active: 'Actif', paused: 'En pause', on_demand: 'A la demande' };
    train.status = status;
    if (status === 'paused') { train.state = 'loading'; train.timer = 0; }
    gs.addLog(`Train ${trainId} : ${labels[status] || status}.`);
    return true;
  },

  // --- Boucle principale ---
  update(gs) {
    for (const train of gs.trains) {
      if (train.status === 'paused') continue;
      const route = gs.routes.find(r => r.id === train.routeId);
      if (!route) continue;

      switch (train.state) {
        case 'loading':   this._stepLoading(train, route, gs);   break;
        case 'moving':    this._stepMoving(train, route);          break;
        case 'unloading': this._stepUnloading(train, route, gs);  break;
      }
    }
  },

  // --- Helpers ---
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

  // === ETATS ===

  _stepLoading(train, route, gs) {
    const C = RailBaron.CONFIG;
    const nodeName = route.stops[train.currentStopIndex];
    const stocks = gs.stocks[nodeName];

    // Si l'arret n'est pas desservi, passer directement a moving
    if (!train.stopsAt[train.currentStopIndex]) {
      train.state = 'moving'; train.timer = 0; train.progress = 0;
      return;
    }

    train.timer += C.TICK_MS;

    // Decharger d'abord les wagons non desires par cette gare (vendus au prochain stop)
    // → le dechargement se fait dans _stepUnloading a l'arrivee
    // Ici on charge

    // Charger chaque type du consist
    for (const [r, maxW] of Object.entries(train.consist)) {
      const current = train.wagonsLoaded[r] || 0;
      const stock = stocks[r] || 0;
      if (current < maxW && stock > 0 && train.timer > C.LOAD_TIME) {
        train.wagonsLoaded[r] = current + 1;
        stocks[r]--;
        train.timer = 0;
        break; // un wagon a la fois
      }
    }

    // Verifier si on doit partir
    const allFull = Object.entries(train.consist).every(([r, maxW]) => (train.wagonsLoaded[r] || 0) >= maxW);
    const allEmpty = Object.values(train.wagonsLoaded).every(v => (v || 0) === 0);
    const stockDry = Object.entries(train.consist).every(([r, maxW]) => {
      return (train.wagonsLoaded[r] || 0) >= maxW || (stocks[r] || 0) === 0;
    });

    // Timeout si bloquee trop longtemps sans stock → demi-tour
    const stuckCycles = train._stuckCycles || 0;
    const isStuck = allEmpty && stockDry;

    const shouldDepart = allFull || (stockDry && !allEmpty) ||
      (!allEmpty && train.status === 'on_demand');

    if (shouldDepart && !allEmpty) {
      train.state = 'moving'; train.progress = 0; train.timer = 0; train._stuckCycles = 0;
    } else if (isStuck) {
      train._stuckCycles = stuckCycles + 1;
      if (train._stuckCycles > 5) {
        train.direction *= -1;
        train.state = 'moving'; train.progress = 0; train.timer = 0; train._stuckCycles = 0;
      }
    } else {
      train._stuckCycles = 0;
    }
  },

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

    // Vitesse en pixels/ms → temps pour 1 segment
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

  _stepUnloading(train, route, gs) {
    const C = RailBaron.CONFIG;
    const nodeName = route.stops[train.currentStopIndex];
    const node = gs.getNode(nodeName);
    const accepts = RailBaron.Tracks._getAcceptsList(node);

    // Si l'arret n'est pas desservi, passer directement
    if (!train.stopsAt[train.currentStopIndex]) {
      train.state = 'loading'; train.timer = 0;
      return;
    }

    train.timer += C.TICK_MS;

    // Decharger les wagons acceptes par cette gare
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
        break; // un wagon a la fois
      }
    }

    // Tout est decharge ?
    const allEmpty = Object.values(train.wagonsLoaded).every(v => (v || 0) === 0);
    if (allEmpty) {
      train.state = 'loading'; train.timer = 0;
    }
  }
};

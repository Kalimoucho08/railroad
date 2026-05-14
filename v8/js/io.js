/* io.js — V7 : sauvegarde localStorage + export/import JSON */
RailBaron.IO = {

  STORAGE_KEY: 'railbaron_v7_save',

  // --- Sauvegarde automatique ---
  save(gs) {
    const data = {
      version: '7.0',
      savedAt: new Date().toISOString(),
      cash: gs.cash, startCash: gs.startCash, turn: gs.turn,
      speed: gs.speed, economicState: gs.economicState,
      edges: gs.edges, routes: gs.routes, trains: gs.trains,
      stations: gs.stations || [], loans: gs.loans || [],
      stocks: gs.stocks, financialHistory: gs.financialHistory || [],
      log: gs.log.slice(0, 20),
      _nextEdgeId: gs._nextEdgeId, _nextTrainId: gs._nextTrainId,
      _nextRouteId: gs._nextRouteId, _nextStationId: gs._nextStationId || 0
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch(e) {
      console.warn('localStorage save failed', e);
      return false;
    }
  },

  // --- Chargement ---
  load(gs) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.version) return false;

      gs.cash = data.cash; gs.startCash = data.startCash; gs.turn = data.turn;
      gs.speed = 0; // toujours pause au chargement
      gs.economicState = data.economicState || 'normal';
      gs.edges = data.edges || [];
      gs.routes = data.routes || [];
      gs.trains = data.trains || [];
      // Remettre les trains en loading au chargement
      for (const t of gs.trains) {
        t.state = 'loading'; t.timer = 0; t.progress = 0; t.monthlyRevenue = 0;
        t.deliveriesThisMonth = 0;
      }
      gs.stations = data.stations || [];
      gs.loans = data.loans || [];
      gs.stocks = data.stocks || {};
      gs.financialHistory = data.financialHistory || [];
      gs.log = data.log || [];
      gs._nextEdgeId = data._nextEdgeId || 0;
      gs._nextTrainId = data._nextTrainId || 0;
      gs._nextRouteId = data._nextRouteId || 0;
      gs._nextStationId = data._nextStationId || 0;
      gs._monthsInPeriod = (gs.turn - 1) % (RailBaron.CONFIG.ACCOUNTING_PERIOD_YEARS * 12);
      gs.monthTimer = 0;
      gs.selectedNode = null;
      gs._buildingRoute = null;

      gs.addLog('Partie chargee depuis la sauvegarde locale.');
      return true;
    } catch(e) {
      console.warn('localStorage load failed', e);
      return false;
    }
  },

  // --- Verifier si une sauvegarde existe ---
  hasSave() {
    try { return !!localStorage.getItem(this.STORAGE_KEY); }
    catch(e) { return false; }
  },

  // --- Supprimer la sauvegarde ---
  deleteSave() {
    try { localStorage.removeItem(this.STORAGE_KEY); }
    catch(e) {}
  },

  // --- Export JSON (telechargement) ---
  exportJSON(gs) {
    const data = {
      version: '7.0',
      exportedAt: new Date().toISOString(),
      cash: gs.cash, startCash: gs.startCash, turn: gs.turn,
      economicState: gs.economicState,
      edges: gs.edges, routes: gs.routes, trains: gs.trains,
      stations: gs.stations, loans: gs.loans,
      stocks: gs.stocks, financialHistory: gs.financialHistory,
      log: gs.log
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const yr = RailBaron.CONFIG.START_YEAR + Math.floor((gs.turn - 1) / 12);
    const mo = String(((gs.turn - 1) % 12) + 1).padStart(2, '0');
    a.download = `railbaron_${yr}${mo}.json`;
    a.click();
    URL.revokeObjectURL(url);
    gs.addLog('Partie exportee.');
  },

  // --- Import JSON (upload) ---
  importJSON(gs, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.version) { throw new Error('Format invalide'); }

        gs.cash = data.cash; gs.startCash = data.startCash; gs.turn = data.turn || 1;
        gs.speed = 0;
        gs.economicState = data.economicState || 'normal';
        gs.edges = data.edges || [];
        gs.routes = data.routes || [];
        gs.trains = data.trains || [];
        for (const t of gs.trains) {
          t.state = 'loading'; t.timer = 0; t.progress = 0; t.monthlyRevenue = 0;
        }
        gs.stations = data.stations || [];
        gs.loans = data.loans || [];
        gs.stocks = data.stocks || {};
        gs.financialHistory = data.financialHistory || [];
        gs.log = data.log || ['Partie importee.'];
        gs._monthsInPeriod = (gs.turn - 1) % (RailBaron.CONFIG.ACCOUNTING_PERIOD_YEARS * 12);
        gs.monthTimer = 0;
        gs.selectedNode = null;
        gs._buildingRoute = null;
        // Preserver les IDs
        gs._nextEdgeId = Math.max(gs._nextEdgeId, ...gs.edges.map(e => parseInt(e.id.slice(1)) || 0)) + 1;
        gs._nextTrainId = Math.max(gs._nextTrainId, ...gs.trains.map(t => parseInt(t.id.slice(1)) || 0)) + 1;
        gs._nextRouteId = Math.max(gs._nextRouteId, ...gs.routes.map(r => parseInt(r.id.slice(1)) || 0)) + 1;

        // Reconstruire les stocks pour tous les noeuds
        RailBaron.Economy.initStocks(gs);
        // Puis ecraser avec les stocks sauvegardes
        if (data.stocks) {
          for (const [nodeName, cargoes] of Object.entries(data.stocks)) {
            if (gs.stocks[nodeName]) {
              for (const [c, v] of Object.entries(cargoes)) {
                gs.stocks[nodeName][c] = v;
              }
            }
          }
        }

        // Rafraichir UI
        if (RailBaron.UI) {
          RailBaron.UI.refreshSelectors();
          RailBaron.UI.updateSidebar();
        }
      } catch(err) {
        gs.addLog('Erreur import : ' + err.message);
      }
    };
    reader.readAsText(file);
  }
};

/* routes.js — V6 : itineraires multi-arrets */
RailBaron.Routes = {

  // Cree une route si chaque paire consecutive a une voie directe
  create(gs, stopNames) {
    if (!stopNames || stopNames.length < 2) {
      gs.addLog('Une route doit avoir au moins 2 arrets.');
      return null;
    }
    // Verifier que chaque paire consecutive a un edge
    for (let i = 0; i < stopNames.length - 1; i++) {
      if (!gs.edgeExists(stopNames[i], stopNames[i + 1])) {
        gs.addLog(`Pas de voie entre ${stopNames[i]} et ${stopNames[i + 1]}. Construisez-la d'abord.`);
        return null;
      }
    }
    // Verifier que la route n'existe pas deja (meme sequence)
    const dup = gs.routes.find(r =>
      r.stops.length === stopNames.length && r.stops.every((s, i) => s === stopNames[i])
    );
    if (dup) {
      gs.addLog('Cette route existe deja.');
      return null;
    }
    const route = {
      id: 'R' + (gs._nextRouteId++),
      name: stopNames.join(' → '),
      stops: stopNames,
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    };
    gs.routes.push(route);
    gs.addLog(`Route ${route.name} creee (${stopNames.length} arrets).`);
    return route;
  },

  // Supprime une route si aucun train n'est assigne
  remove(gs, routeId) {
    const idx = gs.routes.findIndex(r => r.id === routeId);
    if (idx === -1) return false;
    const assigned = gs.trains.filter(t => t.routeId === routeId);
    if (assigned.length) {
      gs.addLog(`Impossible : ${assigned.length} train(s) assigne(s) a cette route. Vendez-les d'abord.`);
      return false;
    }
    const name = gs.routes[idx].name;
    gs.routes.splice(idx, 1);
    gs.addLog(`Route ${name} supprimee.`);
    return true;
  },

  // Retourne les edges qui composent la route
  getEdges(route, gs) {
    const edges = [];
    for (let i = 0; i < route.stops.length - 1; i++) {
      const edge = gs.edges.find(e =>
        (e.a === route.stops[i] && e.b === route.stops[i + 1]) ||
        (e.a === route.stops[i + 1] && e.b === route.stops[i])
      );
      if (edge) edges.push(edge);
    }
    return edges;
  },

  // Retourne les ressources pertinentes pour une route (tous les cargos transportables)
  getSuitableCargo(route, gs) {
    const set = new Set();
    for (let i = 0; i < route.stops.length; i++) {
      const node = gs.getNode(route.stops[i]);
      const produces = RailBaron.Tracks._getProducesList(node);
      for (const r of produces) set.add(r);
    }
    return [...set];
  }
};

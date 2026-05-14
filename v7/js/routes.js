/* routes.js — V7 : itineraires multi-arrets via chemins physiques */
RailBaron.Routes = {

  // BFS : retourne le chemin complet de noeuds entre from et to
  getPath(gs, fromName, toName) {
    if (fromName === toName) return [fromName];
    // BFS avec reconstruction du chemin
    const visited = new Set([fromName]);
    const parent = {};  // node → parent
    const queue = [fromName];
    while (queue.length) {
      const cur = queue.shift();
      for (const e of gs.edges) {
        const neighbor = e.a === cur ? e.b : e.b === cur ? e.a : null;
        if (neighbor && !visited.has(neighbor)) {
          parent[neighbor] = cur;
          if (neighbor === toName) {
            // Reconstruire le chemin
            const path = [toName];
            let n = toName;
            while (n !== fromName) { n = parent[n]; path.unshift(n); }
            return path;
          }
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return null; // pas de chemin
  },

  hasPath(gs, fromName, toName) {
    return this.getPath(gs, fromName, toName) !== null;
  },

  // Construit le fullPath d'une route : toutes les gares traversees
  _buildFullPath(gs, stopNames) {
    const fullPath = [stopNames[0]];
    for (let i = 1; i < stopNames.length; i++) {
      const segment = this.getPath(gs, stopNames[i - 1], stopNames[i]);
      if (!segment) return null;
      // Ajouter les noeuds intermediaires (sauf le premier qui est deja present)
      for (let j = 1; j < segment.length; j++) {
        fullPath.push(segment[j]);
      }
    }
    return fullPath;
  },

  // Cree une route
  create(gs, stopNames) {
    if (!stopNames || stopNames.length < 2) {
      gs.addLog('Une route doit avoir au moins 2 arrets.');
      return null;
    }
    const fullPath = this._buildFullPath(gs, stopNames);
    if (!fullPath) {
      gs.addLog('Impossible de trouver un chemin complet. Verifiez les voies.');
      return null;
    }
    const dup = gs.routes.find(r =>
      r.stops.length === stopNames.length && r.stops.every((s, i) => s === stopNames[i])
    );
    if (dup) { gs.addLog('Cette route existe deja.'); return null; }

    const route = {
      id: 'R' + (gs._nextRouteId++),
      name: stopNames.join(' → '),
      stops: stopNames,           // arrets desservis
      fullPath: fullPath,          // toutes les gares traversees (inclut les intermediaires)
      color: '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
    };
    gs.routes.push(route);
    const intermediate = fullPath.length - stopNames.length;
    gs.addLog(`Route ${route.name} creee (${stopNames.length} arrets, ${intermediate} gare(s) traversees).`);
    return route;
  },

  remove(gs, routeId) {
    const idx = gs.routes.findIndex(r => r.id === routeId);
    if (idx === -1) return false;
    const assigned = gs.trains.filter(t => t.routeId === routeId);
    if (assigned.length) {
      gs.addLog(`Impossible : ${assigned.length} train(s) assigne(s) a cette route.`);
      return false;
    }
    gs.routes.splice(idx, 1);
    gs.addLog(`Route ${gs.routes[idx]?.name || '?'} supprimee.`);
    return true;
  },

  // Retourne les edges qui composent le fullPath de la route
  getPathEdges(route, gs) {
    const edges = [];
    for (let i = 0; i < route.fullPath.length - 1; i++) {
      const edge = gs.edges.find(e =>
        (e.a === route.fullPath[i] && e.b === route.fullPath[i + 1]) ||
        (e.a === route.fullPath[i + 1] && e.b === route.fullPath[i])
      );
      if (edge) edges.push(edge);
    }
    return edges;
  },

  getSuitableCargo(route, gs) {
    const set = new Set();
    for (const stopName of route.stops) {
      const node = gs.getNode(stopName);
      const produces = RailBaron.Tracks._getProducesList(node);
      for (const r of produces) set.add(r);
    }
    return [...set];
  }
};

RailBaron.Tracks = {

  // Distance d'un point a un segment
  _distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx*dx + dy*dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t*dx), py - (y1 + t*dy));
  },

  // Intersection de deux segments (pour les rivieres)
  _segmentsCross(x1,y1,x2,y2,x3,y3,x4,y4) {
    const d = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(d) < 0.001) return false;
    const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / d;
    const u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  },

  // Retourne le point d'intersection avec une riviere (ou null)
  _getRiverCrossing(x1, y1, x2, y2) {
    const C = RailBaron.CONFIG;
    for (const river of C.RIVERS) {
      for (let i = 0; i < river.points.length - 1; i++) {
        const p1 = river.points[i], p2 = river.points[i+1];
        const pt = this._intersectionPoint(x1, y1, x2, y2, p1[0], p1[1], p2[0], p2[1]);
        if (pt) return { x: pt[0], y: pt[1], name: river.name };
      }
    }
    return null;
  },

  // Point d'intersection exact entre deux segments
  _intersectionPoint(x1,y1,x2,y2,x3,y3,x4,y4) {
    const d = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (Math.abs(d) < 0.001) return null;
    const t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / d;
    const u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return [x1 + t*(x2-x1), y1 + t*(y2-y1)];
    }
    return null;
  },

  // Verifie si le segment croise une riviere
  _crossesRiver(x1, y1, x2, y2) {
    return this._getRiverCrossing(x1, y1, x2, y2) !== null;
  },

  // Verifie si le segment traverse une zone (foret ou montagne)
  _crossesZone(x1, y1, x2, y2, zones) {
    for (const z of zones) {
      if (this._distToSegment(z.x, z.y, x1, y1, x2, y2) < z.r) {
        return true;
      }
    }
    return false;
  },

  // Determine le terrain reel traverse par le segment
  _getCrossingTerrain(nodeA, nodeB) {
    const C = RailBaron.CONFIG;
    const x1 = nodeA.x, y1 = nodeA.y, x2 = nodeB.x, y2 = nodeB.y;
    const result = { terrain: 'plains', needsBridge: false, needsTunnel: false, notes: [], bridgePoint: null };

    // Terrain des noeuds (le plus difficile)
    const ta = nodeA.terrain || 'plains';
    const tb = nodeB.terrain || 'plains';
    const tA = C.TERRAIN_TYPES[ta] || C.TERRAIN_TYPES.plains;
    const tB = C.TERRAIN_TYPES[tb] || C.TERRAIN_TYPES.plains;
    result.terrain = tA.costMult >= tB.costMult ? ta : tb;
    if (ta === 'water' || tb === 'water') result.terrain = 'water';
    result.needsBridge = C.TERRAIN_TYPES[result.terrain]?.needsBridge || false;

    // Croisement de riviere → pont obligatoire (point exact)
    const riverCrossing = this._getRiverCrossing(x1, y1, x2, y2);
    if (riverCrossing) {
      result.needsBridge = true;
      result.bridgePoint = { x: riverCrossing.x, y: riverCrossing.y };
      result.notes.push('pont sur ' + riverCrossing.name);
    }

    // Traversee de montagne → possible tunnel
    const crossesMountains = this._crossesZone(x1, y1, x2, y2, C.MOUNTAINS);
    if (crossesMountains && result.terrain !== 'mountains') {
      result.terrain = 'mountains';
    }
    const avgElev = ((nodeA.elevation || 0) + (nodeB.elevation || 0)) / 2;
    const elevDiff = Math.abs((nodeA.elevation || 0) - (nodeB.elevation || 0));
    if ((crossesMountains || result.terrain === 'mountains') && (elevDiff > 30 || avgElev > C.TUNNEL_MIN_ELEVATION)) {
      result.needsTunnel = true;
      result.notes.push('tunnel');
    }

    // Traversee de foret
    if (this._crossesZone(x1, y1, x2, y2, C.FORESTS) && result.terrain === 'plains') {
      result.terrain = 'hills'; // foret = legerement plus difficile
      result.notes.push('foret');
    }

    return result;
  },

  build(gs, nodeA, nodeB) {
    if (nodeA.name === nodeB.name) {
      gs.addLog('Impossible de relier un site à lui-même.');
      return null;
    }
    if (gs.edgeExists(nodeA.name, nodeB.name)) {
      gs.addLog('Cette ligne existe déjà.');
      return null;
    }
    const C = RailBaron.CONFIG;
    const d = RailBaron.dist(nodeA, nodeB);
    const crossing = this._getCrossingTerrain(nodeA, nodeB);
    const tDef = C.TERRAIN_TYPES[crossing.terrain] || C.TERRAIN_TYPES.plains;

    const cost = Math.round((d * C.EDGE_COST_PER_PX + C.EDGE_COST_BASE) * tDef.costMult);
    const bridgeCost = crossing.needsBridge ? C.BRIDGE_COST : 0;
    const tunnelCost = crossing.needsTunnel ? C.TUNNEL_COST : 0;
    const totalCost = cost + bridgeCost + tunnelCost;

    if (gs.cash < totalCost) {
      gs.addLog(`Capital insuffisant (cout : ${RailBaron.money(totalCost)}).`);
      return null;
    }
    gs.cash -= totalCost;
    const edge = {
      id: gs.nextEdgeId(), a: nodeA.name, b: nodeB.name,
      cost: totalCost, terrain: crossing.terrain, builtTurn: gs.turn,
      hasTunnel: crossing.needsTunnel, hasBridge: crossing.needsBridge,
      bridgePoint: crossing.bridgePoint || null
    };
    gs.edges.push(edge);
    const noteStr = crossing.notes.length ? ' (' + crossing.notes.join(', ') + ')' : '';
    gs.addLog(`Voie ${nodeA.name} ↔ ${nodeB.name} (${tDef.label})${noteStr} : ${RailBaron.money(totalCost)}.`);
    return edge;
  },

  renovate(gs, nodeA, nodeB) {
    const edge = gs.edges.find(e =>
      (e.a === nodeA.name && e.b === nodeB.name) ||
      (e.a === nodeB.name && e.b === nodeA.name)
    );
    if (!edge) { gs.addLog('Aucune voie a renover ici.'); return false; }
    const C = RailBaron.CONFIG;
    const cost = Math.round(edge.cost * C.RENOVATION_COST_RATIO);
    if (gs.cash < cost) { gs.addLog(`Capital insuffisant (${RailBaron.money(cost)}).`); return false; }
    gs.cash -= cost;
    edge.builtTurn = gs.turn;
    gs.addLog(`Voie ${edge.a} ↔ ${edge.b} renovee (${RailBaron.money(cost)}).`);
    return true;
  },

  remove(gs, nodeA, nodeB) {
    const idx = gs.edges.findIndex(e =>
      (e.a === nodeA.name && e.b === nodeB.name) ||
      (e.a === nodeB.name && e.b === nodeA.name)
    );
    if (idx === -1) {
      gs.addLog('Aucune voie à démolir ici.');
      return false;
    }
    const C = RailBaron.CONFIG;
    const [removed] = gs.edges.splice(idx, 1);
    const refund = Math.round(removed.cost * C.DEMOLITION_REFUND_RATIO);
    gs.cash += refund;
    gs.removeTrainsOnEdge(removed.id);
    gs.addLog(`Voie ${removed.a} ↔ ${removed.b} démolie (remboursement ${RailBaron.money(refund)}).`);
    return true;
  },

  getSuitableResources(edge, gs) {
    const a = gs.getNode(edge.a);
    const b = gs.getNode(edge.b);
    const list = new Set();

    // Ressources que A peut envoyer vers B
    const aProduces = this._getProducesList(a);
    const bAccepts = this._getAcceptsList(b);
    for (const r of aProduces) {
      if (bAccepts.has(r)) list.add(r);
    }

    // Ressources que B peut envoyer vers A
    const bProduces = this._getProducesList(b);
    const aAccepts = this._getAcceptsList(a);
    for (const r of bProduces) {
      if (aAccepts.has(r)) list.add(r);
    }

    return [...list];
  },

  // Types de cargo produits par un noeud
  _getProducesList(node) {
    const list = [];
    if (node.type === 'city') {
      list.push('passengers', 'mail');
    } else if (node.type === 'producer' && node.produces) {
      list.push(node.produces);
    } else if (node.produces) {
      list.push(node.produces);
    }
    return list;
  },

  // Types de cargo acceptes par un noeud (demande)
  _getAcceptsList(node) {
    const accepts = new Set();
    if (node.type === 'city') {
      // Les villes acceptent tous les biens transformes
      for (const r of ['goods', 'food', 'steel', 'textiles', 'petroleum']) accepts.add(r);
      // Plus les cargos specifies
      if (node.consumes) for (const c of node.consumes) accepts.add(c);
    } else if (node.consumes) {
      // Les industries acceptent leurs inputs specifies
      for (const c of node.consumes) accepts.add(c);
    }
    // On accepte aussi les ressources qu'on produit (pour stockage/revente)
    if (node.type === 'city') {
      accepts.add('passengers');
      accepts.add('mail');
    } else if (node.type === 'producer' && node.produces) {
      accepts.add(node.produces);
    } else if (node.produces) {
      accepts.add(node.produces);
    }
    return accepts;
  }
};

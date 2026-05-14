RailBaron.Tracks = {

  // Calcule le type de terrain effectif entre deux noeuds
  _edgeTerrain(nodeA, nodeB) {
    const ta = nodeA.terrain || 'plains';
    const tb = nodeB.terrain || 'plains';
    const T = RailBaron.CONFIG.TERRAIN_TYPES;
    // Le plus difficile des deux (max costMult)
    const tA = T[ta] || T.plains;
    const tB = T[tb] || T.plains;
    const eff = tA.costMult >= tB.costMult ? ta : tb;
    // Si l'un est 'water', l'autre aussi (eau → eau)
    if (ta === 'water' || tb === 'water') return 'water';
    return eff;
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
    const terrain = this._edgeTerrain(nodeA, nodeB);
    const tDef = C.TERRAIN_TYPES[terrain] || C.TERRAIN_TYPES.plains;

    // Cout = base + distance × multiplicateur terrain
    const cost = Math.round((d * C.EDGE_COST_PER_PX + C.EDGE_COST_BASE) * tDef.costMult);
    // Pont si le terrain est aquatique
    const needsBridge = tDef.needsBridge;
    const bridgeCost = needsBridge ? C.BRIDGE_COST : 0;
    const totalCost = cost + bridgeCost;

    if (gs.cash < totalCost) {
      gs.addLog(`Capital insuffisant (cout : ${RailBaron.money(totalCost)}).`);
      return null;
    }
    gs.cash -= totalCost;
    const edge = {
      id: gs.nextEdgeId(), a: nodeA.name, b: nodeB.name,
      cost: totalCost, terrain, builtTurn: gs.turn
    };
    gs.edges.push(edge);
    const bridgeNote = needsBridge ? ' (avec pont)' : '';
    gs.addLog(`Voie ${nodeA.name} ↔ ${nodeB.name} (${tDef.label})${bridgeNote} : ${RailBaron.money(totalCost)}.`);
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

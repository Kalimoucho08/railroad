RailBaron.Tracks = {
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
    const cost = Math.round(d * C.EDGE_COST_PER_PX + C.EDGE_COST_BASE);
    if (gs.cash < cost) {
      gs.addLog(`Capital insuffisant (coût : ${RailBaron.money(cost)}).`);
      return null;
    }
    gs.cash -= cost;
    const edge = { id: gs.nextEdgeId(), a: nodeA.name, b: nodeB.name, cost };
    gs.edges.push(edge);
    gs.addLog(`Ligne ${nodeA.name} ↔ ${nodeB.name} construite pour ${RailBaron.money(cost)}.`);
    return edge;
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
    for (const r of a.produces) {
      if (b.demands.includes(r) || (b.type === 'city' && r === 'passagers')) {
        list.add(r);
      }
    }
    for (const r of b.produces) {
      if (a.demands.includes(r) || (a.type === 'city' && r === 'passagers')) {
        list.add(r);
      }
    }
    return [...list];
  }
};

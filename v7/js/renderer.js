/* renderer.js — Rendu canvas via camera (coordonnees monde) */
RailBaron.Renderer = {
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  render(gs, camera) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    camera.apply(ctx);
    this._drawBackground(ctx);
    this._drawTracks(gs, ctx);
    this._drawRoutes(gs, ctx);
    this._drawBuildingRoute(gs, ctx);
    for (const node of RailBaron.CONFIG.NODES) {
      this._drawNode(node, gs, ctx);
    }
    for (const train of gs.trains) {
      this._drawTrain(train, gs, ctx);
    }

    ctx.restore();
  },

  _drawBackground(ctx) {
    const W = 1120, H = 700;

    ctx.fillStyle = '#244d31';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 180; i++) {
      const x = (i * 73) % W;
      const y = (i * 97) % H;
      ctx.fillStyle = i % 7 === 0 ? '#315e3a' : '#2a5635';
      ctx.fillRect(x, y, 5, 5);
    }

    ctx.fillStyle = '#2a6a93';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.bezierCurveTo(160, 520, 220, 620, 380, 560);
    ctx.bezierCurveTo(530, 500, 680, 630, 860, 580);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  },

  _drawTracks(gs, ctx) {
    const C = RailBaron.CONFIG;
    for (const e of gs.edges) {
      const a = gs.getNode(e.a);
      const b = gs.getNode(e.b);
      // Couleur selon age : vert (recent) → orange (5+ ans) → rouge (10+ ans)
      const years = Math.max(0, (gs.turn - (e.builtTurn || gs.turn)) / 12);
      let color;
      if (years < 3) color = '#7a9a5a';       // vert
      else if (years < 7) color = '#dcc9a1';   // beige (normal)
      else if (years < 12) color = '#d4a84b';   // orange
      else color = '#c4704a';                   // rouge

      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = '#6d4f21';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  },

  _drawNode(n, gs, ctx) {
    const colors = RailBaron.CONFIG.NODE_COLORS;
    const isSelected = gs.selectedNode && gs.selectedNode.name === n.name;

    ctx.fillStyle = colors[n.type] || '#fff';

    if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = '#20180e';
      ctx.lineWidth = 2;
    }

    if (n.type === 'city') {
      ctx.fillRect(n.x - 11, n.y - 11, 22, 22);
      ctx.strokeRect(n.x - 11, n.y - 11, 22, 22);
    } else {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#f4ecd7';
    ctx.font = 'bold 12px Satoshi, Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, n.x + 15, n.y + 4);

    const stocked = Object.entries(gs.stocks[n.name]).filter(([, v]) => v > 0);
    if (stocked.length) {
      this._drawDepot(n.x, n.y, stocked, ctx);
    }

    // Stocks dynamiques en texte sous le noeud
    if (stocked.length) {
      ctx.font = '9px Satoshi, Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'top';
      const topN = stocked.slice(0, 4);
      for (let i = 0; i < topN.length; i++) {
        const [r, v] = topN[i];
        const cargoDef = (RailBaron.CONFIG.CARGO[r] || RailBaron.CONFIG.RESOURCES[r] || {});
        const shortLabel = (cargoDef.label || r).substring(0, 3);
        ctx.fillText(`${shortLabel}:${v}`, n.x + 15, n.y + 18 + i * 11);
      }
    }
  },

  _drawDepot(x, y, stockItems, ctx) {
    ctx.fillStyle = '#dcc9a1';
    ctx.fillRect(x - 18, y + 14, 36, 14);
    ctx.strokeStyle = '#4a351b';
    ctx.strokeRect(x - 18, y + 14, 36, 14);
    stockItems.slice(0, 4).forEach(([r, v], i) => {
      ctx.fillStyle = (RailBaron.CONFIG.CARGO[r] || RailBaron.CONFIG.RESOURCES[r] || {}).color || '#888';
      ctx.fillRect(x - 15 + i * 8, y + 17, 6, Math.min(8, 2 + v));
    });
  },

  // Route en cours de construction (pointilles)
  _drawBuildingRoute(gs, ctx) {
    const stops = gs._buildingRoute;
    if (!stops || stops.length < 2) return;
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    const first = gs.getNode(stops[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < stops.length; i++) {
      const n = gs.getNode(stops[i]);
      ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },

  _drawTrain(train, gs, ctx) {
    const route = gs.routes.find(r => r.id === train.routeId);
    if (!route) return;
    const curNode = gs.getNode(route.stops[train.currentStopIndex]);
    const dir = train.direction;
    const nextIdx = train.currentStopIndex + dir;
    if (nextIdx < 0 || nextIdx >= route.stops.length) return;
    const nextNode = gs.getNode(route.stops[nextIdx]);

    const p = train.progress;
    const x = curNode.x + (nextNode.x - curNode.x) * p;
    const y = curNode.y + (nextNode.y - curNode.y) * p;
    const angle = Math.atan2(nextNode.y - curNode.y, nextNode.x - curNode.x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Wagons multicolores (dans l'ordre du consist)
    let wOffset = 0;
    const C = RailBaron.CONFIG;
    for (const [r, maxW] of Object.entries(train.consist)) {
      const cargoDef = C.CARGO[r] || {};
      const loaded = train.wagonsLoaded[r] || 0;
      for (let i = 0; i < maxW; i++) {
        // Wagon vide = couleur terne, plein = couleur vive
        ctx.fillStyle = i < loaded ? (cargoDef.color || '#888') : '#555';
        ctx.fillRect(-18 - wOffset * 11, -5, 9, 10);
        ctx.strokeStyle = '#111';
        ctx.strokeRect(-18 - wOffset * 11, -5, 9, 10);
        wOffset++;
      }
    }

    // Locomotive
    ctx.fillStyle = '#101010';
    ctx.fillRect(-4, -7, 16, 14);
    ctx.fillStyle = '#d3c08c';
    ctx.fillRect(8, -5, 4, 10);
    ctx.strokeStyle = '#eee0b7';
    ctx.strokeRect(-4, -7, 16, 14);
    ctx.restore();
  },

  // Dessiner les routes (lignes colorees)
  _drawRoutes(gs, ctx) {
    for (const route of gs.routes) {
      ctx.strokeStyle = route.color || '#dcc9a1';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const first = gs.getNode(route.stops[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < route.stops.length; i++) {
        const n = gs.getNode(route.stops[i]);
        ctx.lineTo(n.x, n.y);
      }
      ctx.stroke();
    }
  },

  // --- Hit testing (coords monde) — inclut la zone du texte ---
  getNodeAt(wx, wy) {
    const R = RailBaron.CONFIG.NODE_HIT_RADIUS;
    return RailBaron.CONFIG.NODES.find(n => {
      // Cercle autour de l'icone
      if (Math.hypot(n.x - wx, n.y - wy) < R) return true;
      // Rectangle du texte (nom a droite de l'icone)
      const textW = n.name.length * 7.5 + 4;
      const textH = 14;
      const tx = n.x + 13, ty = n.y - textH / 2;
      return wx >= tx && wx <= tx + textW && wy >= ty && wy <= ty + textH;
    }) || null;
  },

  getTrainAt(wx, wy, gs) {
    const HIT = 16;
    for (const train of gs.trains) {
      const route = gs.routes.find(r => r.id === train.routeId);
      if (!route) continue;
      const curNode = gs.getNode(route.stops[train.currentStopIndex]);
      const nextIdx = train.currentStopIndex + train.direction;
      if (nextIdx < 0 || nextIdx >= route.stops.length) continue;
      const nextNode = gs.getNode(route.stops[nextIdx]);
      const p = train.progress;
      const tx = curNode.x + (nextNode.x - curNode.x) * p;
      const ty = curNode.y + (nextNode.y - curNode.y) * p;
      if (Math.abs(wx - tx) < HIT && Math.abs(wy - ty) < HIT) {
        return train;
      }
    }
    return null;
  }
};

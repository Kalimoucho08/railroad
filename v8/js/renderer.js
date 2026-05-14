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
    this._drawTerrain(gs, ctx);
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

  // Rivières, forets, montagnes
  _drawTerrain(gs, ctx) {
    const C = RailBaron.CONFIG;

    // Forets (cercles verts avec arbres deterministes)
    for (let fi = 0; fi < C.FORESTS.length; fi++) {
      const f = C.FORESTS[fi];
      ctx.fillStyle = '#1a4a1a';
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0d3d0d';
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 8; i++) {
        const seed = fi * 100 + i;
        const angle = ((seed * 7) % 100) / 100 * Math.PI * 2;
        const dist = f.r * (0.3 + ((seed * 13) % 100) / 100 * 0.6);
        const tx = f.x + Math.cos(angle) * dist;
        const ty = f.y + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.moveTo(tx, ty - 5);
        ctx.lineTo(tx - 4, ty + 3);
        ctx.lineTo(tx + 4, ty + 3);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // Montagnes (triangles deterministes)
    for (let mi = 0; mi < C.MOUNTAINS.length; mi++) {
      const m = C.MOUNTAINS[mi];
      ctx.fillStyle = '#6b5b4a';
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5a4a3a';
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 6; i++) {
        const seed = mi * 100 + i;
        const mx = m.x + (((seed * 17) % 100) / 100 - 0.5) * m.r * 1.2;
        const my = m.y + (((seed * 23) % 100) / 100 - 0.5) * m.r * 1.2;
        const s = 8 + ((seed * 31) % 100) / 100 * 12;
        ctx.beginPath();
        ctx.moveTo(mx - s, my + s*0.6);
        ctx.lineTo(mx, my - s*0.8);
        ctx.lineTo(mx + s, my + s*0.6);
        ctx.closePath();
        ctx.fill();
        // Neige
        ctx.fillStyle = '#e8e4d9';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(mx - s*0.3, my - s*0.1);
        ctx.lineTo(mx, my - s*0.8);
        ctx.lineTo(mx + s*0.3, my - s*0.1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5a4a3a';
        ctx.globalAlpha = 0.6;
      }
    }
    ctx.globalAlpha = 1.0;

    // Rivieres (courbes bleues)
    for (const river of C.RIVERS) {
      if (river.points.length < 2) continue;
      ctx.strokeStyle = '#3a7abf';
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(river.points[0][0], river.points[0][1]);
      for (let i = 1; i < river.points.length - 1; i += 2) {
        const cp1 = river.points[i];
        const cp2 = river.points[i + 1] || river.points[i];
        const end = river.points[i + 1] || river.points[i];
        ctx.quadraticCurveTo(cp1[0], cp1[1], end[0], end[1]);
      }
      ctx.stroke();
      // Bordure plus foncee
      ctx.strokeStyle = '#2a5a8f';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Cercles de terrain autour des noeuds
    for (const node of C.NODES) {
      const tDef = C.TERRAIN_TYPES[node.terrain] || C.TERRAIN_TYPES.plains;
      ctx.fillStyle = tDef.color;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  },

  _drawTracks(gs, ctx) {
    const C = RailBaron.CONFIG;
    const activeEdges = RailBaron.Economy._getActiveEdgeIds(gs);
    for (const e of gs.edges) {
      const a = gs.getNode(e.a);
      const b = gs.getNode(e.b);
      // Couleur selon age (seulement si la voie est utilisee)
      const isActive = activeEdges.has(e.id);
      const years = isActive ? Math.max(0, (gs.turn - (e.builtTurn || gs.turn)) / 12) : 0;
      let color;
      if (years < 3) color = '#7a9a5a';       // vert/neuf
      else if (years < 7) color = '#dcc9a1';   // beige
      else if (years < 12) color = '#d4a84b';   // orange
      else color = '#c4704a';                   // rouge

      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = '#4a351b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Marqueur pont/tunnel au milieu
      if (e.hasBridge || e.hasTunnel) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.fillStyle = e.hasTunnel ? '#3a2a1a' : '#1a4a8a';
        ctx.fillRect(mx - 6, my - 6, 12, 12);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.hasTunnel ? 'T' : 'P', mx, my);
        ctx.textAlign = 'start';
      }
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

  // Route en cours de construction (calcule le fullPath pour les pointilles)
  _drawBuildingRoute(gs, ctx) {
    const stops = gs._buildingRoute;
    if (!stops || stops.length < 2) return;
    const fullPath = RailBaron.Routes._buildFullPath(gs, stops);
    if (!fullPath) return;
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    const first = gs.getNode(fullPath[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < fullPath.length; i++) {
      const n = gs.getNode(fullPath[i]);
      ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },

  _drawTrain(train, gs, ctx) {
    const route = gs.routes.find(r => r.id === train.routeId);
    if (!route) return;
    const curNode = gs.getNode(route.fullPath[train.currentStopIndex]);
    const dir = train.direction;
    const nextIdx = train.currentStopIndex + dir;
    if (nextIdx < 0 || nextIdx >= route.fullPath.length) return;
    const nextNode = gs.getNode(route.fullPath[nextIdx]);

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

  // Dessiner les routes (trait fin pointille par-dessus les voies)
  _drawRoutes(gs, ctx) {
    for (const route of gs.routes) {
      ctx.strokeStyle = route.color || '#dcc9a1';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      const first = gs.getNode(route.fullPath[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < route.fullPath.length; i++) {
        const n = gs.getNode(route.fullPath[i]);
        ctx.lineTo(n.x, n.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
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
      const curNode = gs.getNode(route.fullPath[train.currentStopIndex]);
      const nextIdx = train.currentStopIndex + train.direction;
      if (nextIdx < 0 || nextIdx >= route.fullPath.length) continue;
      const nextNode = gs.getNode(route.fullPath[nextIdx]);
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

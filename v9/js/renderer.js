/* renderer.js — V9 : rendu de la grille de tuiles avec viewport culling + LOD */
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

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    camera.apply(ctx);

    const range = RailBaron.Tiles.visibleRange(camera, w, h);
    const screenTS = RailBaron.CONFIG.TILE_SIZE * camera.zoom;

    // LOD: quand la tuile fait < 4px ecran, on groupe par blocs
    const step = screenTS < 4 ? Math.ceil(4 / screenTS) : 1;

    this._drawTilesLOD(gs, ctx, range, step);

    if (gs.showGrid && screenTS >= 6) {
      this._drawGrid(ctx, range);
    }

    this._drawHighlight(gs, ctx);

    ctx.restore();
  },

  /** Dessiner les tuiles avec terrain + elevation fusionnes */
  _drawTilesLOD(gs, ctx, range, step) {
    const T = RailBaron.CONFIG.TILE_SIZE;
    const terrains = RailBaron.CONFIG.TERRAIN_TYPES;
    const blockW = T * step;
    const blockH = T * step;

    for (let col = range.colStart; col <= range.colEnd; col += step) {
      for (let row = range.rowStart; row <= range.rowEnd; row += step) {
        const tile = gs.tiles[col][row];
        const tDef = terrains[tile.terrain] || terrains.plains;
        ctx.fillStyle = this._elevationColor(tDef.color, tile.elevation);
        ctx.fillRect(col * T - 0.5, row * T - 0.5, blockW + 1, blockH + 1);
      }
    }
  },

  /** Ajuster une couleur hex par l'elevation */
  _elevationColor(hex, elev) {
    const factor = 1 + (elev - 50) / 100 * 0.35; // 0.825 a 1.175
    if (Math.abs(factor - 1) < 0.01) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const clamp = v => Math.max(0, Math.min(255, Math.round(v * factor)));
    return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  },

  /** Grille de surimpression */
  _drawGrid(ctx, range) {
    const T = RailBaron.CONFIG.TILE_SIZE;
    const C = RailBaron.CONFIG;

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;

    for (let col = range.colStart; col <= range.colEnd + 1; col++) {
      const x = col * T;
      ctx.beginPath();
      ctx.moveTo(x, range.rowStart * T);
      ctx.lineTo(x, (range.rowEnd + 1) * T);
      ctx.stroke();
    }

    for (let row = range.rowStart; row <= range.rowEnd + 1; row++) {
      const y = row * T;
      ctx.beginPath();
      ctx.moveTo(range.colStart * T, y);
      ctx.lineTo((range.colEnd + 1) * T, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, C.WORLD_W, C.WORLD_H);
  },

  /** Surbrillance tuile survolee + selectionnee */
  _drawHighlight(gs, ctx) {
    const T = RailBaron.CONFIG.TILE_SIZE;

    if (gs.hoveredTile) {
      const ht = gs.hoveredTile;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ht.col * T, ht.row * T, T, T);
    }

    if (gs.selectedTile) {
      const st = gs.selectedTile;
      ctx.strokeStyle = 'rgba(255,220,80,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(st.col * T, st.row * T, T, T);
    }
  }
};

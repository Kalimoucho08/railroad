/* tiles.js — V9 : manipulation de la grille de tuiles */
RailBaron.Tiles = {

  /** Creer une grille vierge */
  createGrid() {
    const C = RailBaron.CONFIG;
    const grid = new Array(C.GRID_COLS);
    for (let col = 0; col < C.GRID_COLS; col++) {
      grid[col] = new Array(C.GRID_ROWS);
      for (let row = 0; row < C.GRID_ROWS; row++) {
        grid[col][row] = {
          terrain: 'plains',
          elevation: 0,
          resource: null,
          resourceAmount: 0,
          owner: null,
          building: null,
          structure: null
        };
      }
    }
    return grid;
  },

  /** Coordonnees monde → {col, row} */
  worldToTile(wx, wy) {
    const T = RailBaron.CONFIG.TILE_SIZE;
    return {
      col: Math.floor(wx / T),
      row: Math.floor(wy / T)
    };
  },

  /** {col, row} → coordonnees monde du coin superieur gauche */
  tileToWorld(col, row) {
    const T = RailBaron.CONFIG.TILE_SIZE;
    return { x: col * T, y: row * T };
  },

  /** Recuperer une tuile par coordonnees monde (retourne null si hors grille) */
  getTile(gs, wx, wy) {
    const { col, row } = this.worldToTile(wx, wy);
    const C = RailBaron.CONFIG;
    if (col < 0 || col >= C.GRID_COLS || row < 0 || row >= C.GRID_ROWS) return null;
    return { col, row, tile: gs.tiles[col][row] };
  },

  /** Calculer la plage de tuiles visibles selon la viewport camera */
  visibleRange(camera, canvasW, canvasH) {
    const C = RailBaron.CONFIG;
    const T = C.TILE_SIZE;
    const wl = camera.screenToWorld(0, 0);
    const wr = camera.screenToWorld(canvasW, canvasH);
    return {
      colStart: Math.max(0, Math.floor(wl.x / T) - 1),
      colEnd:   Math.min(C.GRID_COLS - 1, Math.ceil(wr.x / T) + 1),
      rowStart: Math.max(0, Math.floor(wl.y / T) - 1),
      rowEnd:   Math.min(C.GRID_ROWS - 1, Math.ceil(wr.y / T) + 1)
    };
  }
};

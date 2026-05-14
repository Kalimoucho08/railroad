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

  /** Generation placeholder (pseudo-elevation par sinus) en attendant le Perlin de l'etape 2 */
  generatePlaceholder(gs) {
    const C = RailBaron.CONFIG;
    for (let col = 0; col < C.GRID_COLS; col++) {
      for (let row = 0; row < C.GRID_ROWS; row++) {
        const elev = this._pseudoElevation(col, row);
        const terrain = this._elevationToTerrain(elev);
        gs.tiles[col][row].terrain = terrain;
        gs.tiles[col][row].elevation = elev;
      }
    }
  },

  /** Pseudo-elevation par somme de sinusoides */
  _pseudoElevation(col, row) {
    const C = RailBaron.CONFIG;
    const fx = col / C.GRID_COLS, fy = row / C.GRID_ROWS;
    // Bords = eau garantie (proportionnel a la taille)
    const edgeCols = Math.round(C.GRID_COLS * 0.04);
    const edgeRows = Math.round(C.GRID_ROWS * 0.05);
    const edgeDist = Math.min(col, C.GRID_COLS - 1 - col, row, C.GRID_ROWS - 1 - row);
    if (edgeDist <= 1) return 5;
    if (edgeDist <= edgeCols * 0.4) return 12;

    let e = 0;
    e += Math.sin(fx * 14 + fy * 10) * 0.30;
    e += Math.sin(fx * 22 - fy * 18 + 1.7) * 0.20;
    e += Math.sin(fx * 5 + fy * 25 + 0.4) * 0.25;
    e += Math.cos(fx * 17 + fy * 11) * 0.15;
    e += Math.sin(fx * 35 - fy * 28) * 0.10;
    e = (e + 0.65) / 1.30 * 100;
    return Math.max(0, Math.min(100, Math.round(e)));
  },

  /** Conversion elevation → type de terrain */
  _elevationToTerrain(elev) {
    if (elev <= 15) return 'water';
    if (elev <= 25) return 'swamp';
    if (elev <= 45) return 'plains';
    if (elev <= 65) return 'forest';
    if (elev <= 80) return 'hills';
    return 'mountains';
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

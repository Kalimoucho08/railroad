/* game-state.js — V9 : etat du jeu centre sur la grille de tuiles */
RailBaron.GameState = class {
  constructor() {
    this.reset();
  }

  reset() {
    this.cash = RailBaron.CONFIG.STARTING_CAPITAL;
    this.turn = 1;
    this.speed = 0;
    this.monthTimer = 0;
    this.tool = 'inspect';         // outil actif
    this.hoveredTile = null;       // {col, row} ou null
    this.selectedTile = null;      // {col, row} ou null
    this.showGrid = true;          // affichage de la grille

    this.tiles = RailBaron.Tiles.createGrid();
    RailBaron.Tiles.generatePlaceholder(this);

    this.trains = [];
    this.routes = [];
    this.edges = [];
    this.log = [];
  }

  addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > 80) this.log.length = 80;
  }
};

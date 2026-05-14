/* main.js — V9 : boucle principale, initialisation */
RailBaron.Main = {
  init() {
    const canvas = document.getElementById('gameCanvas');
    RailBaron.Renderer.init(canvas);

    this.gs = new RailBaron.GameState();
    this.camera = RailBaron.Camera;
    RailBaron.Camera.init();

    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    RailBaron.Input.init(this.gs, this.camera, canvas);

    this.gs.addLog('V9 — Moteur de carte tuile. Grille 50x36, 1800 tuiles.');
    this.gs.addLog('[G] masquer/afficher la grille. [F] fit monde. [0] reset zoom.');
    this.gs.addLog('Molette = zoom. Glisser = deplacer. Clic = selectionner tuile.');

    this._lastTimestamp = 0;
    this.loop(0);
  },

  _resizeCanvas() {
    const canvas = document.getElementById('gameCanvas');
    const container = document.getElementById('mapContainer');
    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W <= 0 || H <= 0) return;

    canvas.width = W;
    canvas.height = H;

    const worldW = RailBaron.CONFIG.WORLD_W;
    const worldH = RailBaron.CONFIG.WORLD_H;
    const fitZoom = Math.min(W / worldW, H / worldH);
    this.camera.zoom = fitZoom;
    this.camera.targetZoom = fitZoom;
    this.camera.x = (W - worldW * fitZoom) / 2;
    this.camera.y = (H - worldH * fitZoom) / 2;

    this._updateZoomIndicator();
  },

  _updateZoomIndicator() {
    const el = document.getElementById('zoomIndicator');
    if (el) el.textContent = Math.round(this.camera.zoom * 100) + '%';
  },

  _updateInfoBar() {
    const el = document.getElementById('selectedInfo');
    if (!el) return;
    const gs = this.gs;
    const ht = gs.hoveredTile;
    if (ht && ht.tile) {
      const tDef = RailBaron.CONFIG.TERRAIN_TYPES[ht.tile.terrain];
      const label = tDef ? tDef.label : ht.tile.terrain;
      el.textContent = `[${ht.col},${ht.row}] ${label}  elev:${ht.tile.elevation}`;
    } else {
      el.textContent = 'Survolez une tuile';
    }
  },

  loop(timestamp) {
    const gs = RailBaron.Main.gs;
    const camera = RailBaron.Main.camera;

    let dt = timestamp - RailBaron.Main._lastTimestamp || 16;
    if (dt > 100) dt = 16;
    if (dt <= 0) dt = 16;
    RailBaron.Main._lastTimestamp = timestamp;

    camera.animateSnap();

    RailBaron.Renderer.render(gs, camera);
    RailBaron.Main._updateZoomIndicator();
    RailBaron.Main._updateInfoBar();

    requestAnimationFrame((t) => RailBaron.Main.loop(t));
  }
};

document.addEventListener('DOMContentLoaded', () => RailBaron.Main.init());

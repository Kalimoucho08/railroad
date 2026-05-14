/* main.js — Boucle principale V4 avec camera, resize, overlays */
RailBaron.Main = {
  init() {
    const canvas = document.getElementById('gameCanvas');
    RailBaron.Renderer.init(canvas);
    RailBaron.Camera.init();
    RailBaron.Overlays.init();

    this.gs = new RailBaron.GameState();
    this.camera = RailBaron.Camera;

    RailBaron.Economy.initPrices(this.gs);
    RailBaron.Economy.initStocks(this.gs);

    // Ajuster le canvas et la camera a la taille du conteneur
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    // Input gere les interactions carte (pan, zoom, hover)
    RailBaron.Input.init(this.gs, this.camera, canvas, RailBaron.Renderer);

    // UI gere la sidebar et les clicks de jeu
    RailBaron.UI.init(this.gs, RailBaron.Renderer, this.camera);

    this.gs.addLog('Compagnie creee. Construis des lignes puis affecte des convois.');
    this.gs.addLog('Astuce : relie une production a une ville ou une industrie, puis achete un convoi dedie.');
    this.gs.addLog('Molette pour zoomer, glisser pour deplacer la carte.');

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

    // Ajuster la camera pour que le monde (1120x700) soit visible
    const worldW = RailBaron.CONFIG.CANVAS_WIDTH;
    const worldH = RailBaron.CONFIG.CANVAS_HEIGHT;
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

  loop(timestamp) {
    const gs = RailBaron.Main.gs;
    const camera = RailBaron.Main.camera;

    let dt = RailBaron.Main._lastTimestamp ? timestamp - RailBaron.Main._lastTimestamp : 16;
    if (dt > 100) dt = 16;
    if (dt <= 0) dt = 16;
    RailBaron.Main._lastTimestamp = timestamp;

    // Animation snap zoom
    camera.animateSnap();

    RailBaron.Trains.update(gs);

    if (gs.speed > 0 && !gs.isFinished) {
      gs.monthTimer += dt * gs.speed;
      while (gs.monthTimer >= RailBaron.CONFIG.MONTH_DURATION_MS && !gs.isFinished) {
        gs.monthTimer -= RailBaron.CONFIG.MONTH_DURATION_MS;
        RailBaron.Economy.processMonthEnd(gs);
      }
    }

    RailBaron.Renderer.render(gs, camera);
    RailBaron.UI.updateSidebar();
    RailBaron.Main._updateZoomIndicator();
    RailBaron.Main._animId = requestAnimationFrame((t) => RailBaron.Main.loop(t));
  }
};

document.addEventListener('DOMContentLoaded', () => RailBaron.Main.init());

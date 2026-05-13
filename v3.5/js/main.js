RailBaron.Main = {
  init() {
    const canvas = document.getElementById('gameCanvas');
    RailBaron.Renderer.init(canvas);

    this.gs = new RailBaron.GameState();
    RailBaron.Economy.initPrices(this.gs);
    RailBaron.Economy.initStocks(this.gs);

    RailBaron.UI.init(this.gs, RailBaron.Renderer);

    this.gs.addLog('Compagnie créée. Construis des lignes puis affecte des convois.');
    this.gs.addLog('Astuce : relie une production à une ville ou une industrie, puis achète un convoi dédié.');

    this._lastTimestamp = 0;
    this.loop(0);
  },

  loop(timestamp) {
    const gs = RailBaron.Main.gs;

    let dt = RailBaron.Main._lastTimestamp ? timestamp - RailBaron.Main._lastTimestamp : 16;
    if (dt > 100) dt = 16;
    if (dt <= 0) dt = 16;
    RailBaron.Main._lastTimestamp = timestamp;

    RailBaron.Trains.update(gs);

    if (gs.speed > 0 && !gs.isFinished) {
      gs.monthTimer += dt * gs.speed;
      while (gs.monthTimer >= RailBaron.CONFIG.MONTH_DURATION_MS && !gs.isFinished) {
        gs.monthTimer -= RailBaron.CONFIG.MONTH_DURATION_MS;
        RailBaron.Economy.processMonthEnd(gs);
      }
    }

    RailBaron.Renderer.render(gs);
    RailBaron.UI.updateSidebar();
    RailBaron.Main._animId = requestAnimationFrame((t) => RailBaron.Main.loop(t));
  }
};

document.addEventListener('DOMContentLoaded', () => RailBaron.Main.init());

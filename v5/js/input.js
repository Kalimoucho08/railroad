/* input.js — Gestion unifiee souris/clavier, dispatch selon contexte */
RailBaron.Input = {
  gs: null,
  camera: null,

  // Etat interne
  _dragging: false,
  _dragMoved: false,
  _dragStart: null,
  _dragCamStart: null,
  _lastWheelTime: 0,
  _snapTimer: null,
  _snapDelay: 250,

  init(gs, camera, canvas, renderer) {
    this.gs = gs;
    this.camera = camera;
    this.canvas = canvas;
    this.renderer = renderer;

    canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    canvas.addEventListener('mouseleave', e => this._onMouseUp(e));
    canvas.addEventListener('wheel', e => this._onWheel(e), { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => this._onKeyDown(e));
  },

  canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * this.canvas.width / r.width,
      y: (e.clientY - r.top) * this.canvas.height / r.height,
      cssX: e.clientX - r.left,
      cssY: e.clientY - r.top
    };
  },

  _onMouseDown(e) {
    const pos = this.canvasPos(e);
    const world = this.camera.screenToWorld(pos.x, pos.y);

    // Priorite au noeud (sinon les trains bloquent le clic sur les gares)
    const hitNode = this.renderer.getNodeAt(world.x, world.y);
    if (hitNode && e.button === 0) {
      // Le clic jeu est gere par ui.js, on laisse passer
      return;
    }

    // Sinon, clic sur un train → fiche detail
    const hitTrain = this.renderer.getTrainAt(world.x, world.y, this.gs);
    if (hitTrain && e.button === 0) {
      if (RailBaron.Overlays) RailBaron.Overlays.showTrainDetail(hitTrain, this.gs, this.camera, this.canvas);
      return;
    }

    // Sinon, debut drag pan (bouton gauche ou milieu)
    if (e.button === 0 || e.button === 1) {
      this._dragging = true;
      this._dragMoved = false;
      this._dragStart = { x: e.clientX, y: e.clientY };
      this._dragCamStart = { x: this.camera.x, y: this.camera.y };
      this.canvas.style.cursor = 'grabbing';
    }
  },

  _onMouseMove(e) {
    const pos = this.canvasPos(e);
    const world = this.camera.screenToWorld(pos.x, pos.y);

    if (this._dragging) {
      const dx = e.clientX - this._dragStart.x;
      const dy = e.clientY - this._dragStart.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) this._dragMoved = true;
      this.camera.x = this._dragCamStart.x + dx;
      this.camera.y = this._dragCamStart.y + dy;
      return;
    }

    // Survol noeud → curseur pointer + tooltip
    const hoverNode = this.renderer.getNodeAt(world.x, world.y);
    const hoverTrain = this.renderer.getTrainAt(world.x, world.y, this.gs);

    if (hoverNode) {
      this.canvas.style.cursor = 'pointer';
      if (RailBaron.Overlays) RailBaron.Overlays.showNodeTooltip(hoverNode, this.gs, pos, pos.cssX, pos.cssY);
    } else if (hoverTrain) {
      this.canvas.style.cursor = 'pointer';
      if (RailBaron.Overlays) RailBaron.Overlays.hideTooltip();
    } else {
      this.canvas.style.cursor = this._dragging ? 'grabbing' : 'default';
      if (RailBaron.Overlays) RailBaron.Overlays.hideTooltip();
    }
  },

  _onMouseUp(e) {
    this._dragging = false;
    this.canvas.style.cursor = 'default';
  },

  _onWheel(e) {
    e.preventDefault();
    const pos = this.canvasPos(e);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.camera.zoomAt(pos.x, pos.y, factor);

    // Snap apres delai
    clearTimeout(this._snapTimer);
    this._snapTimer = setTimeout(() => {
      this.camera.snapZoom();
    }, this._snapDelay);
  },

  _onKeyDown(e) {
    switch (e.key) {
      case 'Escape':
        this.gs.selectedNode = null;
        if (RailBaron.Overlays) RailBaron.Overlays.closeDetail();
        if (RailBaron.UI) RailBaron.UI.updateSidebar();
        break;
      case '0': this._setSpeed(0); break;
      case '1': this._setSpeed(1); break;
      case '2': this._setSpeed(2); break;
      case '3': this._setSpeed(4); break;
    }
  },

  _setSpeed(val) {
    this.gs.speed = val;
    const v = String(val);
    document.querySelectorAll('.speed-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.speed === v);
    });
  }
};

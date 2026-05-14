/* input.js — V9 : gestion souris/clavier pour navigation grille */
RailBaron.Input = {
  _dragging: false,
  _dragX: 0,
  _dragY: 0,
  _middleDown: false,

  init(gs, camera, canvas) {
    this.gs = gs;
    this.camera = camera;
    this.canvas = canvas;

    canvas.addEventListener('mousedown', e => this._onMouseDown(e));
    canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    canvas.addEventListener('mouseup', e => this._onMouseUp(e));
    canvas.addEventListener('mouseleave', e => this._onMouseUp(e));
    canvas.addEventListener('wheel', e => { e.preventDefault(); this._onWheel(e); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    // Touches
    window.addEventListener('keydown', e => this._onKeyDown(e));
  },

  _onMouseDown(e) {
    // Clic gauche : drag ou selection tuile
    if (e.button === 0) {
      this._dragging = true;
      this._dragX = e.clientX;
      this._dragY = e.clientY;
      this._dragMoved = false;
    }
    // Clic milieu : drag
    if (e.button === 1) {
      this._middleDown = true;
      this._dragX = e.clientX;
      this._dragY = e.clientY;
    }
  },

  _onMouseMove(e) {
    // Mise a jour de la tuile survolee
    const world = this.camera.screenToWorld(e.offsetX, e.offsetY);
    this.gs.hoveredTile = RailBaron.Tiles.getTile(this.gs, world.x, world.y);

    // Drag
    if (this._dragging || this._middleDown) {
      const dx = e.clientX - this._dragX;
      const dy = e.clientY - this._dragY;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        this._dragMoved = true;
        this.camera.pan(dx, dy);
        this._dragX = e.clientX;
        this._dragY = e.clientY;
      }
    }
  },

  _onMouseUp(e) {
    // Clic sans drag = selection tuile
    if (e.button === 0 && this._dragging && !this._dragMoved) {
      const world = this.camera.screenToWorld(e.offsetX, e.offsetY);
      const result = RailBaron.Tiles.getTile(this.gs, world.x, world.y);
      this.gs.selectedTile = result;
    }

    if (e.button === 0) this._dragging = false;
    if (e.button === 1) this._middleDown = false;
  },

  _onWheel(e) {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.camera.zoomAt(sx, sy, factor);
  },

  _onKeyDown(e) {
    switch (e.key) {
      case 'g':
        this.gs.showGrid = !this.gs.showGrid;
        break;
      case 'f':
        this._fitToWorld();
        break;
      case '0':
        this.camera.zoom = 1;
        this.camera.targetZoom = 1;
        this.camera.x = 0;
        this.camera.y = 0;
        break;
    }
  },

  _fitToWorld() {
    const C = RailBaron.CONFIG;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const fitZoom = Math.min(w / C.WORLD_W, h / C.WORLD_H);
    this.camera.zoom = fitZoom;
    this.camera.targetZoom = fitZoom;
    this.camera.x = (w - C.WORLD_W * fitZoom) / 2;
    this.camera.y = (h - C.WORLD_H * fitZoom) / 2;
  }
};

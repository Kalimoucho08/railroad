/* camera.js — Camera canvas avec pan, zoom, snap */
RailBaron.Camera = {
  x: 0, y: 0,
  zoom: 1,
  targetZoom: 1,

  MIN_ZOOM: 0.5,
  MAX_ZOOM: 4.0,

  init() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetZoom = 1;
  },

  apply(ctx) {
    ctx.setTransform(this.zoom, 0, 0, this.zoom, this.x, this.y);
  },

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.x) / this.zoom,
      y: (sy - this.y) / this.zoom
    };
  },

  worldToScreen(wx, wy) {
    return {
      x: wx * this.zoom + this.x,
      y: wy * this.zoom + this.y
    };
  },

  zoomAt(screenX, screenY, factor) {
    const worldBefore = this.screenToWorld(screenX, screenY);
    this.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoom * factor));
    this.targetZoom = this.zoom;
    const worldAfter = this.screenToWorld(screenX, screenY);
    this.x += (worldAfter.x - worldBefore.x) * this.zoom;
    this.y += (worldAfter.y - worldBefore.y) * this.zoom;
  },

  snapZoom() {
    const snapped = Math.round(this.zoom);
    if (snapped >= this.MIN_ZOOM && snapped <= this.MAX_ZOOM && snapped !== this.targetZoom) {
      this.targetZoom = snapped;
    }
  },

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
  },

  animateSnap() {
    if (Math.abs(this.zoom - this.targetZoom) < 0.005) {
      this.zoom = this.targetZoom;
      return;
    }
    this.zoom += (this.targetZoom - this.zoom) * 0.25;
  }
};

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
    this._updateTooltip(e);

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

  _updateTooltip(e) {
    const tooltip = document.getElementById('tileTooltip');
    if (!tooltip) return;
    const ht = this.gs.hoveredTile;
    if (!ht || !ht.tile) {
      tooltip.style.display = 'none';
      return;
    }
    const tDef = RailBaron.CONFIG.TERRAIN_TYPES[ht.tile.terrain];
    const terrain = tDef ? tDef.label : ht.tile.terrain;
    let lines = [];
    lines.push(`[${ht.col},${ht.row}] ${terrain}  elev:${ht.tile.elevation}`);
    if (ht.tile.building) {
      const s = ht.tile.structure;
      const city = this.gs.cities.find(c => c.id === s);
      if (city) {
        let cityInfo = `Ville: ${city.name} (pop ${city.population})`;
        if (city.industryCount > 0) cityInfo += ` — ${city.industryCount} ind.`;
        lines.push(cityInfo);
      }
      const ind = this.gs.industries.find(i => i.id === s);
      if (ind) {
        const attachedCity = ind.cityId ? this.gs.cities.find(c => c.id === ind.cityId) : null;
        const cityNote = attachedCity ? ` (→ ${attachedCity.name})` : '';
        lines.push(`${ind.label}${cityNote}`);
      }
    }
    if (ht.tile.resource) {
      const cargoLabels = { grain:'Grain', lumber:'Bois', coal:'Charbon', iron_ore:'Fer', oil:'Petrole' };
      lines.push(`${cargoLabels[ht.tile.resource] || ht.tile.resource}: ${ht.tile.resourceAmount}`);
    }
    tooltip.innerHTML = lines.join('<br>');
    tooltip.style.display = 'block';
    const rect = this.canvas.getBoundingClientRect();
    tooltip.style.left = (e.clientX - rect.left) + 'px';
    tooltip.style.top = (e.clientY - rect.top) + 'px';
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

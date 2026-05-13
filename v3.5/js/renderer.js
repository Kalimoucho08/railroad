RailBaron.Renderer = {
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  },

  render(gs) {
    this._drawBackground();
    this._drawTracks(gs);
    for (const node of RailBaron.CONFIG.NODES) {
      this._drawNode(node, gs);
    }
    for (const train of gs.trains) {
      this._drawTrain(train, gs);
    }
  },

  _drawBackground() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#244d31';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 180; i++) {
      const x = (i * 73) % w;
      const y = (i * 97) % h;
      ctx.fillStyle = i % 7 === 0 ? '#315e3a' : '#2a5635';
      ctx.fillRect(x, y, 5, 5);
    }
    ctx.fillStyle = '#2a6a93';
    ctx.beginPath();
    ctx.moveTo(0, 600);
    ctx.bezierCurveTo(160, 520, 220, 620, 380, 560);
    ctx.bezierCurveTo(530, 500, 680, 630, 860, 580);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  },

  _drawTracks(gs) {
    const ctx = this.ctx;
    for (const e of gs.edges) {
      const a = gs.getNode(e.a);
      const b = gs.getNode(e.b);
      ctx.strokeStyle = '#dcc9a1';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = '#6d4f21';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  },

  _drawNode(n, gs) {
    const ctx = this.ctx;
    const colors = RailBaron.CONFIG.NODE_COLORS;
    const isSelected = gs.selectedNode && gs.selectedNode.name === n.name;
    const isHovered = gs.hoveredNode && gs.hoveredNode.name === n.name && !isSelected;

    ctx.fillStyle = colors[n.type] || '#fff';

    if (isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
    } else if (isSelected) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
    } else {
      ctx.strokeStyle = '#20180e';
      ctx.lineWidth = 2;
    }

    if (n.type === 'city') {
      ctx.fillRect(n.x - 10, n.y - 10, 20, 20);
      ctx.strokeRect(n.x - 10, n.y - 10, 20, 20);
    } else {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = '#f4ecd7';
    ctx.font = '12px Satoshi';
    ctx.fillText(n.name, n.x + 14, n.y + 4);

    const stocked = Object.entries(gs.stocks[n.name]).filter(([, v]) => v > 0);
    if (stocked.length) {
      this._drawDepot(n.x, n.y, stocked);
    }
  },

  _drawDepot(x, y, stockItems) {
    const ctx = this.ctx;
    ctx.fillStyle = '#dcc9a1';
    ctx.fillRect(x - 18, y + 14, 36, 14);
    ctx.strokeStyle = '#4a351b';
    ctx.strokeRect(x - 18, y + 14, 36, 14);
    stockItems.slice(0, 4).forEach(([r, v], i) => {
      ctx.fillStyle = RailBaron.CONFIG.RESOURCES[r].color;
      ctx.fillRect(x - 15 + i * 8, y + 17, 6, Math.min(8, 2 + v));
    });
  },

  _drawTrain(train, gs) {
    const ctx = this.ctx;
    const from = gs.getNode(train.from);
    const to = gs.getNode(train.to);
    const p = train.progress;
    const x = from.x + (to.x - from.x) * p;
    const y = from.y + (to.y - from.y) * p;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    for (let i = 0; i < train.wagons; i++) {
      ctx.fillStyle = RailBaron.CONFIG.RESOURCES[train.resource].color;
      ctx.fillRect(-18 - i * 11, -5, 9, 10);
      ctx.strokeStyle = '#111';
      ctx.strokeRect(-18 - i * 11, -5, 9, 10);
    }

    ctx.fillStyle = '#101010';
    ctx.fillRect(-4, -7, 16, 14);
    ctx.fillStyle = '#d3c08c';
    ctx.fillRect(8, -5, 4, 10);
    ctx.strokeStyle = '#eee0b7';
    ctx.strokeRect(-4, -7, 16, 14);
    ctx.restore();
  },

  getNodeAt(x, y) {
    const R = RailBaron.CONFIG.NODE_HIT_RADIUS;
    return RailBaron.CONFIG.NODES.find(n => Math.hypot(n.x - x, n.y - y) < R) || null;
  }
};

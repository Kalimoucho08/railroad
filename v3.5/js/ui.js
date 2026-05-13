RailBaron.UI = {
  init(gs, renderer) {
    this.gs = gs;
    this.renderer = renderer;
    this._cacheDom();
    this._wireTools();
    this._wireCanvas();
    this._wireButtons();
    this._wireSelectors();
    this._wireVisibility();
    this.refreshSelectors();
    this.updateSidebar();
  },

  _cacheDom() {
    const q = s => document.querySelector(s);
    this.el = {
      cash:        q('#cashValue'),
      profit:      q('#profitValue'),
      turn:        q('#turnValue'),
      trainCount:  q('#trainCount'),
      toolStatus:  q('#toolStatus'),
      routeSelect: q('#routeSelect'),
      resourceSelect: q('#resourceSelect'),
      resourceList:   q('#resourceList'),
      stationList:    q('#stationList'),
      trainList:      q('#trainList'),
      logBox:         q('#logBox'),
      selectedBadge:      q('#selectedBadge'),
      networkBadge:       q('#networkBadge'),
      speedBadge:         q('#speedBadge'),
      monthProgressFill:  q('#monthProgressFill'),
      monthProgressLabel: q('#monthProgressLabel'),
      canvas:             q('#gameCanvas')
    };
  },

  _wireTools() {
    const btns = document.querySelectorAll('[data-tool]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gs.tool = btn.dataset.tool;
        this.el.toolStatus.textContent =
          `Outil actif : ${this.gs.tool === 'rail' ? 'poser voie' : 'démolir'}.`;
      });
    });
  },

  _wireCanvas() {
    const canvas = this.el.canvas;
    canvas.addEventListener('click', e => {
      const pt = this._canvasPoint(e);
      const node = this.renderer.getNodeAt(pt.x, pt.y);
      if (!node) return;
      if (!this.gs.selectedNode) {
        this.gs.selectedNode = node;
        this.gs.addLog(`${node.name} sélectionné.`);
      } else {
        if (this.gs.tool === 'rail') {
          RailBaron.Tracks.build(this.gs, this.gs.selectedNode, node);
        } else {
          RailBaron.Tracks.remove(this.gs, this.gs.selectedNode, node);
        }
        this.gs.selectedNode = null;
        this.refreshSelectors();
      }
      this.updateSidebar();
    });

    canvas.addEventListener('mousemove', e => {
      const pt = this._canvasPoint(e);
      this.gs.hoveredNode = this.renderer.getNodeAt(pt.x, pt.y);
    });

    canvas.addEventListener('mouseleave', () => {
      this.gs.hoveredNode = null;
    });
  },

  _wireButtons() {
    this._wireSpeed();
    document.getElementById('restartBtn').addEventListener('click', () => {
      this.gs.reset();
      RailBaron.Economy.initPrices(this.gs);
      RailBaron.Economy.initStocks(this.gs);
      this.refreshSelectors();
      this.updateSidebar();
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      const pauseBtn = document.querySelector('[data-speed="0"]');
      if (pauseBtn) pauseBtn.classList.add('active');
      this.gs.addLog('Nouvelle partie démarrée.');
    });
    document.getElementById('themeBtn').addEventListener('click', () => {
      const root = document.documentElement;
      root.setAttribute('data-theme',
        root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  },

  _wireSpeed() {
    const btns = document.querySelectorAll('.speed-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gs.speed = parseInt(btn.dataset.speed);
      });
    });
  },

  _wireSelectors() {
    this.el.routeSelect.addEventListener('change', () => this.updateResourceOptions());
    document.getElementById('buyTrainBtn').addEventListener('click', () => {
      RailBaron.Trains.spawn(this.gs, this.el.routeSelect.value, this.el.resourceSelect.value);
      this.refreshSelectors();
      this.updateSidebar();
    });
  },

  _wireVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (RailBaron.Main._animId) {
          cancelAnimationFrame(RailBaron.Main._animId);
          RailBaron.Main._animId = null;
        }
      } else {
        if (!RailBaron.Main._animId) {
          RailBaron.Main._animId = requestAnimationFrame((t) => RailBaron.Main.loop(t));
        }
      }
    });
  },

  _canvasPoint(e) {
    const canvas = this.el.canvas;
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  },

  // --- Sidebar refresh ---

  updateSidebar() {
    const gs = this.gs;
    this.el.cash.textContent       = RailBaron.money(gs.cash);
    this.el.profit.textContent     = RailBaron.money(gs.profit);
    this.el.turn.textContent       = `${Math.min(gs.turn, RailBaron.CONFIG.MAX_TURNS)}/${RailBaron.CONFIG.MAX_TURNS}`;
    this.el.trainCount.textContent = gs.trains.length;
    this.el.selectedBadge.textContent = `Sélection : ${gs.selectedNode ? gs.selectedNode.name : 'aucune'}`;
    this.el.networkBadge.textContent  = `Voies : ${gs.edges.length}`;
    const speedLabels = { 0: '⏸ Pause', 1: '▶ 1×', 2: '▶▶ 2×', 4: '▶▶▶ 4×' };
    this.el.speedBadge.textContent = speedLabels[gs.speed] || '⏸ Pause';

    const progressPct = gs.isFinished ? 100 : Math.min(100, (gs.monthTimer / RailBaron.CONFIG.MONTH_DURATION_MS) * 100);
    this.el.monthProgressFill.style.width = `${progressPct}%`;
    this.el.monthProgressLabel.textContent = `Mois ${Math.min(gs.turn, RailBaron.CONFIG.MAX_TURNS)}/${RailBaron.CONFIG.MAX_TURNS}`;

    this._renderResourceList(gs);
    this._renderStationList(gs);
    this._renderTrainList(gs);
    this._renderLog(gs);
  },

  _renderResourceList(gs) {
    const C = RailBaron.CONFIG;
    this.el.resourceList.innerHTML = Object.entries(C.RESOURCES).map(([k, v]) => {
      const price = gs.prices[k];
      const cls = price > v.base ? 'good' : 'mini';
      return `<div class="resource-row">
        <div><strong>${v.label}</strong><div class="mini">Base ${RailBaron.money(v.base)}</div></div>
        <div class="${cls}">${RailBaron.money(price)}</div>
      </div>`;
    }).join('');
  },

  _renderStationList(gs) {
    const C = RailBaron.CONFIG;
    this.el.stationList.innerHTML = C.NODES.map(n => {
      const visible = Object.entries(gs.stocks[n.name])
        .filter(([, v]) => v > 0)
        .slice(0, 3)
        .map(([r, v]) => `${C.RESOURCES[r].label}:${v}`)
        .join(' · ') || 'Aucun stock';
      return `<div class="station-row">
        <div><strong>${n.name}</strong><div class="mini">${visible}</div></div>
        <div>${n.type}</div>
      </div>`;
    }).join('');
  },

  _renderTrainList(gs) {
    this.el.trainList.innerHTML = gs.trains.length
      ? gs.trains.map(t => `<div class="train-row">
          <div>
            <strong>${RailBaron.CONFIG.RESOURCES[t.resource].label}</strong>
            ${t.from} → ${t.to}
            <div class="mini">${t.wagons}/${t.maxWagons} wagons · ${t.state} · profit ${RailBaron.money(t.lifetimeProfit)}</div>
          </div>
          <div>${RailBaron.money(t.monthlyRevenue)}</div>
        </div>`).join('')
      : '<div class="mini">Aucun convoi acheté.</div>';
  },

  _renderLog(gs) {
    this.el.logBox.textContent = gs.log.join('\n');
  },

  // --- Selectors ---

  refreshSelectors() {
    const gs = this.gs;
    this.el.routeSelect.innerHTML = gs.edges.length
      ? gs.edges.map(e => `<option value="${e.id}">${e.a} ↔ ${e.b}</option>`).join('')
      : '<option value="">Aucune ligne</option>';
    this.updateResourceOptions();
  },

  updateResourceOptions() {
    const gs = this.gs;
    const edge = gs.getEdgeById(this.el.routeSelect.value) || gs.edges[0];
    if (!edge) {
      this.el.resourceSelect.innerHTML = '<option value="">Aucune ressource</option>';
      return;
    }
    const opts = RailBaron.Tracks.getSuitableResources(edge, gs);
    this.el.resourceSelect.innerHTML = opts.length
      ? opts.map(r => `<option value="${r}">${RailBaron.CONFIG.RESOURCES[r].label}</option>`).join('')
      : '<option value="">Aucune marchandise adaptée</option>';
  }
};

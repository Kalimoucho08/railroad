/* ui.js — Sidebar retractable, controles, log, canvas game clicks */
RailBaron.UI = {
  init(gs, renderer, camera) {
    this.gs = gs;
    this.renderer = renderer;
    this.camera = camera;
    this._sidebarLocked = false;

    this._cacheDom();
    this._wireSidebar();
    this._wireAccordions();
    this._wireTools();
    this._wireCanvas();
    this._wireButtons();
    this._wireSelectors();
    this._wireLogToggle();
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
      logBar:         q('#logBar'),
      selectedBadge:      q('#selectedBadge'),
      networkBadge:       q('#networkBadge'),
      speedBadge:         q('#speedBadge'),
      monthProgressFill:  q('#monthProgressFill'),
      monthProgressLabel: q('#monthProgressLabel'),
      sbCash:             q('#sbCash'),
      sidebar:            q('#sidebar'),
      canvas:             q('#gameCanvas')
    };
  },

  // --- Sidebar expand / collapse ---
  _wireSidebar() {
    const sb = this.el.sidebar;

    // Survol = expand temporaire
    sb.addEventListener('mouseenter', () => {
      if (!this._sidebarLocked) sb.classList.add('expanded');
    });
    sb.addEventListener('mouseleave', () => {
      if (!this._sidebarLocked) sb.classList.remove('expanded');
    });

    // Clic toggle = lock/unlock
    const toggle = (locked) => {
      this._sidebarLocked = locked;
      if (locked) sb.classList.add('expanded');
      else sb.classList.remove('expanded');
    };

    document.getElementById('sbToggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(!this._sidebarLocked);
    });
    document.getElementById('sbToggle2').addEventListener('click', (e) => {
      e.stopPropagation();
      toggle(false);
    });
  },

  // --- Accordions ---
  _wireAccordions() {
    const headers = document.querySelectorAll('.sb-section-hd');
    headers.forEach(hd => {
      hd.addEventListener('click', () => {
        hd.classList.toggle('open');
      });
    });
  },

  // --- Tools (rail / delete) ---
  _wireTools() {
    const allBtns = () => document.querySelectorAll('[data-tool]');
    allBtns().forEach(btn => {
      btn.addEventListener('click', () => {
        allBtns().forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.gs.tool = btn.dataset.tool;
        if (this.el.toolStatus) {
          this.el.toolStatus.textContent =
            `Outil actif : ${this.gs.tool === 'rail' ? 'poser voie' : 'demolir'}.`;
        }
        // Sync les boutons collapsed
        document.querySelectorAll('.sb-collapsed [data-tool]').forEach(b => {
          b.classList.toggle('active', b.dataset.tool === this.gs.tool);
        });
      });
    });
  },

  // --- Canvas (game logic clicks) ---
  _wireCanvas() {
    const canvas = this.el.canvas;
    canvas.addEventListener('click', (e) => {
      // Ignorer si on vient de finir un drag (pan)
      if (RailBaron.Input._dragging) return;

      const pos = RailBaron.Input.canvasPos(e);
      const world = this.camera.screenToWorld(pos.x, pos.y);
      const node = this.renderer.getNodeAt(world.x, world.y);
      if (!node) return;

      if (!this.gs.selectedNode) {
        this.gs.selectedNode = node;
        this.gs.addLog(`${node.name} selectionne.`);
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
  },

  // --- Buttons (speed, restart, theme) ---
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
      // Sync collapsed speed buttons
      document.querySelectorAll('.sb-collapsed .speed-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.speed === '0');
      });
      this.gs.addLog('Nouvelle partie demarree.');
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
        // Sync entre collapsed et expanded
        const val = btn.dataset.speed;
        document.querySelectorAll('.speed-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.speed === val);
        });
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

  // --- Log toggle ---
  _wireLogToggle() {
    const btn = document.getElementById('logToggle');
    const bar = this.el.logBar;
    btn.addEventListener('click', () => {
      bar.classList.toggle('open');
      btn.textContent = bar.classList.contains('open') ? 'Journal ▼' : 'Journal ▲';
    });
  },

  // --- Visibility (pause quand onglet en arriere-plan) ---
  _wireVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (RailBaron.Main._animId) {
          cancelAnimationFrame(RailBaron.Main._animId);
          RailBaron.Main._animId = null;
        }
      } else {
        if (!RailBaron.Main._animId) {
          RailBaron.Main._lastTimestamp = 0;
          RailBaron.Main._animId = requestAnimationFrame((t) => RailBaron.Main.loop(t));
        }
      }
    });
  },

  // --- Sidebar refresh ---
  updateSidebar() {
    const gs = this.gs;
    this.el.cash.textContent       = RailBaron.money(gs.cash);
    this.el.profit.textContent     = RailBaron.money(gs.profit);
    this.el.turn.textContent       = `${Math.min(gs.turn, RailBaron.CONFIG.MAX_TURNS)}/${RailBaron.CONFIG.MAX_TURNS}`;
    this.el.trainCount.textContent = gs.trains.length;
    this.el.selectedBadge.textContent = `Selection : ${gs.selectedNode ? gs.selectedNode.name : 'aucune'}`;
    this.el.networkBadge.textContent  = `Voies : ${gs.edges.length}`;
    const speedLabels = { 0: 'Pause', 1: '1x', 2: '2x', 4: '4x' };
    this.el.speedBadge.textContent = speedLabels[gs.speed] || 'Pause';

    // Mini cash dans la sidebar collapsed
    if (this.el.sbCash) {
      this.el.sbCash.textContent = RailBaron.money(gs.cash);
    }

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
      return `<div class="res-row">
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
      return `<div class="st-row">
        <div><strong>${n.name}</strong><div class="mini">${visible}</div></div>
        <div>${n.type}</div>
      </div>`;
    }).join('');
  },

  _renderTrainList(gs) {
    this.el.trainList.innerHTML = gs.trains.length
      ? gs.trains.map(t => `<div class="tr-row">
          <div>
            <strong>${RailBaron.CONFIG.RESOURCES[t.resource].label}</strong>
            ${t.from} → ${t.to}
            <div class="mini">${t.wagons}/${t.maxWagons} wagons · ${t.state} · profit ${RailBaron.money(t.lifetimeProfit)}</div>
          </div>
          <div>${RailBaron.money(t.monthlyRevenue)}</div>
        </div>`).join('')
      : '<div class="mini">Aucun convoi achete.</div>';
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
      : '<option value="">Aucune marchandise adaptee</option>';
  }
};

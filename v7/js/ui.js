/* ui.js — Sidebar retractable, controles, log, canvas game clicks */
RailBaron.UI = {
  init(gs, renderer, camera) {
    this.gs = gs;
    this.renderer = renderer;
    this.camera = camera;
    this._pinned = true;
    this._buildingRoute = false;

    this._cacheDom();
    this._wireSidebar();
    this._applyPinState();
    this._wireAccordions();
    this._wireTools();
    this._wireCanvas();
    this._wireButtons();
    this._wireRouteBuilder();
    this._wireConsistBuilder();
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
      resourceList:   q('#resourceList'),
      stationList:    q('#stationList'),
      trainList:      q('#trainList'),
      routeList:      q('#routeList'),
      routeBuilderInfo: q('#routeBuilderInfo'),
      consistBuilder:  q('#consistBuilder'),
      consistSummary:  q('#consistSummary'),
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

  // --- Sidebar pin ---
  _wireSidebar() {
    const pinToggle = () => {
      this._pinned = !this._pinned;
      this._applyPinState();
    };
    document.getElementById('sbPin').addEventListener('click', (e) => { e.stopPropagation(); pinToggle(); });
    document.getElementById('sbPin2').addEventListener('click', (e) => { e.stopPropagation(); pinToggle(); });
  },

  _applyPinState() {
    const sb = this.el.sidebar;
    if (this._pinned) {
      sb.classList.add('pinned');
    } else {
      sb.classList.remove('pinned');
    }
    // Sync pin icon opacity
    const pins = document.querySelectorAll('.sb-pin');
    pins.forEach(p => p.classList.toggle('active', this._pinned));
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
      if (RailBaron.Input._dragMoved) { RailBaron.Input._dragMoved = false; return; }

      const pos = RailBaron.Input.canvasPos(e);
      const world = this.camera.screenToWorld(pos.x, pos.y);
      const node = this.renderer.getNodeAt(world.x, world.y);
      if (!node) return;

      // Mode construction de route
      if (this._buildingRoute) {
        this._addStopToRoute(node);
        return;
      }

      // Mode normal : construction/demolition voie
      if (!this.gs.selectedNode) {
        this.gs.selectedNode = node;
        this.gs.addLog(`${node.name} selectionne.`);
      } else if (this.gs.selectedNode.name === node.name) {
        // Re-clic sur le meme noeud → fiche detail
        RailBaron.Overlays.showNodeDetail(node, this.gs);
        this.gs.selectedNode = null;
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
      RailBaron.Economy.init(this.gs);
      this.refreshSelectors();
      this.updateSidebar();
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      const pauseBtn = document.querySelector('[data-speed="0"]');
      if (pauseBtn) pauseBtn.classList.add('active');
      document.querySelectorAll('.sb-collapsed .speed-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.speed === '0');
      });
      this.gs.addLog('Nouvelle partie demarree.');
      this._pinned = true;
      this._applyPinState();
    });
    document.getElementById('themeBtn').addEventListener('click', () => {
      const root = document.documentElement;
      root.setAttribute('data-theme',
        root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    // Rapport financier
    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) reportBtn.addEventListener('click', () => {
      RailBaron.Overlays.showFinancialReport(this.gs);
    });
    // Emprunt
    const loanBtn = document.getElementById('loanBtn');
    if (loanBtn) loanBtn.addEventListener('click', () => {
      RailBaron.Economy.takeLoan(this.gs);
      this.updateSidebar();
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

  // --- Route builder ---
  _wireRouteBuilder() {
    document.getElementById('startRouteBtn').addEventListener('click', () => {
      this._buildingRoute = true;
      this.gs._buildingRoute = [];
      document.getElementById('startRouteBtn').style.display = 'none';
      document.getElementById('cancelRouteBtn').style.display = '';
      document.getElementById('finishRouteBtn').style.display = '';
      document.getElementById('finishRouteBtn').disabled = true;
      this.el.routeBuilderInfo.innerHTML = '<b style="color:var(--color-primary)">Cliquez les gares dans l\'ordre sur la carte.</b>';
      this.updateSidebar();
    });
    document.getElementById('cancelRouteBtn').addEventListener('click', () => {
      this._cancelRouteBuild();
    });
    document.getElementById('finishRouteBtn').addEventListener('click', () => {
      this._finishRoute();
    });
  },

  _addStopToRoute(node) {
    const stops = this.gs._buildingRoute || [];
    // Eviter doublon consecutif
    if (stops.length > 0 && stops[stops.length - 1] === node.name) return;

    // Verifier qu'un chemin existe depuis le dernier stop
    if (stops.length > 0 && !RailBaron.Routes.hasPath(this.gs, stops[stops.length - 1], node.name)) {
      this.gs.addLog(`Aucun chemin entre ${stops[stops.length - 1]} et ${node.name}.`);
      return;
    }

    stops.push(node.name);
    this.gs._buildingRoute = stops;
    const btn = document.getElementById('finishRouteBtn');
    if (btn) btn.disabled = stops.length < 2;
    this.el.routeBuilderInfo.innerHTML = '<b style="color:var(--color-good)">' + stops.join(' → ') + '</b>';
    this.updateSidebar();
  },

  _finishRoute() {
    const stops = this.gs._buildingRoute;
    if (stops && stops.length >= 2) {
      RailBaron.Routes.create(this.gs, stops);
    }
    this._cancelRouteBuild();
  },

  _cancelRouteBuild() {
    this._buildingRoute = false;
    this.gs._buildingRoute = null;
    document.getElementById('startRouteBtn').style.display = '';
    document.getElementById('cancelRouteBtn').style.display = 'none';
    document.getElementById('finishRouteBtn').style.display = 'none';
    this.el.routeBuilderInfo.innerHTML = '<span class="mini">Construisez des voies puis creez une route.</span>';
    this.refreshSelectors();
    this.updateSidebar();
  },

  // --- Consist builder ---
  _wireConsistBuilder() {
    document.getElementById('buyTrainBtn').addEventListener('click', () => {
      const routeId = this.el.routeSelect.value;
      if (!routeId) { this.gs.addLog('Selectionnez une route.'); return; }
      const consist = this._readConsist();
      if (Object.keys(consist).length === 0) { this.gs.addLog('Ajoutez au moins un wagon.'); return; }
      const route = this.gs.routes.find(r => r.id === routeId);
      const stopsAt = route ? route.stops.map(() => true) : null;
      RailBaron.Trains.spawn(this.gs, routeId, consist, stopsAt);
      this.refreshSelectors();
      this.updateSidebar();
    });
    this.el.routeSelect.addEventListener('change', () => this._renderConsistBuilder());
  },

  _renderConsistBuilder() {
    const routeId = this.el.routeSelect.value;
    const route = this.gs.routes.find(r => r.id === routeId);
    if (!route) { this.el.consistBuilder.innerHTML = '<div class="mini">Selectionnez une route.</div>'; return; }

    const cargoes = RailBaron.Routes.getSuitableCargo(route, this.gs);
    if (!cargoes.length) { this.el.consistBuilder.innerHTML = '<div class="mini">Aucune marchandise adaptee.</div>'; return; }

    const C = RailBaron.CONFIG;
    this._consistData = this._consistData || {};
    let html = '';
    for (const c of cargoes) {
      const def = C.CARGO[c] || {};
      const qty = this._consistData[c] || 0;
      html += `<div class="consist-row">
        <span style="display:inline-block;width:10px;height:10px;background:${def.color || '#888'};margin-right:4px"></span>
        <span style="flex:1">${def.label || c}</span>
        <button class="tb-act" data-adj="-1" data-cargo="${c}">-</button>
        <span style="min-width:20px;text-align:center">${qty}</span>
        <button class="tb-act" data-adj="1" data-cargo="${c}">+</button>
      </div>`;
    }
    this.el.consistBuilder.innerHTML = html;
    this._updateConsistSummary();

    // Wirer les +/-
    this.el.consistBuilder.querySelectorAll('.tb-act').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.cargo;
        const adj = parseInt(btn.dataset.adj);
        this._consistData[c] = Math.max(0, (this._consistData[c] || 0) + adj);
        this._renderConsistBuilder();
      });
    });
  },

  _readConsist() {
    const data = {};
    for (const [k, v] of Object.entries(this._consistData || {})) {
      if (v > 0) data[k] = v;
    }
    return data;
  },

  _updateConsistSummary() {
    const data = this._readConsist();
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    const C = RailBaron.CONFIG;
    const cost = total ? C.TRAIN_COST + total * C.WAGON_COST : 0;
    this.el.consistSummary.textContent = total ? `${total} wagons — Cout : ${RailBaron.money(cost)}` : '';
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
    const C = RailBaron.CONFIG;
    this.el.cash.textContent       = RailBaron.money(gs.cash);
    this.el.profit.textContent     = RailBaron.money(gs.profit);
    this.el.turn.textContent       = `${String(gs.currentMonth).padStart(2,'0')}/${gs.currentYear}`;
    this.el.trainCount.textContent = gs.trains.length;
    this.el.selectedBadge.textContent = `Selection : ${gs.selectedNode ? gs.selectedNode.name : 'aucune'}`;
    this.el.networkBadge.textContent  = `Voies : ${gs.edges.length} | Dette : ${RailBaron.money(gs.totalDebt)}`;
    const ecoLabel = C.ECONOMIC_STATES[gs.economicState] ? C.ECONOMIC_STATES[gs.economicState].label : '?';
    const speedLabels = { 0: 'Pause', 1: '1x', 2: '2x', 4: '4x' };
    this.el.speedBadge.textContent = `${speedLabels[gs.speed] || 'Pause'} | ${ecoLabel}`;

    if (this.el.sbCash) {
      this.el.sbCash.textContent = RailBaron.money(gs.cash);
    }

    const progressPct = gs.isFinished ? 100 : Math.min(100, (gs.monthTimer / C.MONTH_DURATION_MS) * 100);
    this.el.monthProgressFill.style.width = `${progressPct}%`;
    this.el.monthProgressLabel.textContent = `${String(gs.currentMonth).padStart(2,'0')}/${gs.currentYear} (${gs.turn}/${gs.maxTurns})`;

    this._renderResourceList(gs);
    this._renderStationList(gs);
    this._renderTrainList(gs);
    this._renderLog(gs);
  },

  _renderResourceList(gs) {
    const C = RailBaron.CONFIG;
    this.el.resourceList.innerHTML = Object.entries(C.CARGO).map(([k, v]) => {
      const clsDef = C.CARGO_CLASSES[v.class];
      return `<div class="res-row">
        <div><strong>${v.label}</strong><div class="mini">${clsDef ? clsDef.label : ''} — taux ${RailBaron.money(v.baseRate)}</div></div>
        <div>${v.perishable ? 'Pér.' : ''}</div>
      </div>`;
    }).join('');
  },

  _renderStationList(gs) {
    const C = RailBaron.CONFIG;
    this.el.stationList.innerHTML = C.NODES.map(n => {
      const visible = Object.entries(gs.stocks[n.name])
        .filter(([, v]) => v > 0)
        .slice(0, 3)
        .map(([r, v]) => `${(C.CARGO[r] || C.RESOURCES[r] || {}).label || r}:${v}`)
        .join(' · ') || 'Aucun stock';
      return `<div class="st-row">
        <div><strong>${n.name}</strong><div class="mini">${visible}</div></div>
        <div>${n.type}</div>
      </div>`;
    }).join('');
  },

  _renderTrainList(gs) {
    const self = this;
    if (!gs.trains.length) {
      this.el.trainList.innerHTML = '<div class="mini">Aucun convoi achete.</div>';
      return;
    }
    this.el.trainList.innerHTML = gs.trains.map(t => {
      const consistList = Object.entries(t.consist).map(([r, n]) => `${n}x${(RailBaron.CONFIG.CARGO[r] || {}).label || r}`).join(', ');
      const loadedList = Object.entries(t.wagonsLoaded).filter(([,v]) => v > 0).map(([r, v]) => `${v}x${(RailBaron.CONFIG.CARGO[r] || {}).label || r}`).join(', ') || 'vide';
      const route = gs.routes.find(r => r.id === t.routeId);
      const routeName = route ? route.name : '?';
      const stLabels = { active: '', paused: 'PAUSE', on_demand: 'DEM.' };
      const st = stLabels[t.status] || '';
      const curStop = route ? route.stops[t.currentStopIndex] : '?';
      const age = Math.floor(Math.max(0, (gs.turn - (t.builtTurn || gs.turn)) / 12));
      return `<div class="tr-row" data-train="${t.id}">
        <div>
          <strong>${t.id}</strong> ${st} <span class="mini">${routeName}</span>
          <div class="mini">Consist: ${consistList} | Chargé: ${loadedList} | Âge: ${age} an(s)</div>
          <div class="mini">À ${curStop} · ${t.state} · Vie: ${RailBaron.money(t.lifetimeProfit)} | Mois: ${RailBaron.money(t.monthlyRevenue)}</div>
          <div class="train-actions">
            ${t.status !== 'active' ? `<button class="tb-act" data-act="active" data-tid="${t.id}">▶</button>` : `<button class="tb-act" data-act="paused" data-tid="${t.id}">⏸</button>`}
            <button class="tb-act" data-act="on_demand" data-tid="${t.id}">⏳</button>
            <button class="tb-act tb-sell" data-act="sell" data-tid="${t.id}">Vendre</button>
          </div>
        </div>
      </div>`;
    }).join('');

    this.el.trainList.querySelectorAll('.tb-act').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tid = btn.dataset.tid;
        const act = btn.dataset.act;
        if (act === 'sell') {
          RailBaron.Trains.sellTrain(self.gs, tid);
        } else {
          RailBaron.Trains.setTrainStatus(self.gs, tid, act);
        }
        self.refreshSelectors();
        self.updateSidebar();
      });
    });
  },

  _renderLog(gs) {
    this.el.logBox.textContent = gs.log.join('\n');
  },

  // --- Selectors ---
  refreshSelectors() {
    const gs = this.gs;
    this.el.routeSelect.innerHTML = gs.routes.length
      ? gs.routes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')
      : '<option value="">Aucune route</option>';
    this._renderConsistBuilder();
    this._renderRouteList();
  },

  // --- Liste des routes ---
  _renderRouteList() {
    const gs = this.gs;
    if (!gs.routes.length) {
      this.el.routeList.innerHTML = '<div class="mini">Aucune route. Construisez des voies puis creez une route.</div>';
      return;
    }
    this.el.routeList.innerHTML = gs.routes.map(r => {
      const trainCount = gs.trains.filter(t => t.routeId === r.id).length;
      return `<div class="st-row">
        <div><strong>${r.name}</strong><div class="mini">${r.stops.length} arrets · ${trainCount} train(s)</div></div>
        <button class="tb-act tb-sell" data-delroute="${r.id}">✕</button>
      </div>`;
    }).join('');
    // Wirer delete
    this.el.routeList.querySelectorAll('[data-delroute]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        RailBaron.Routes.remove(this.gs, btn.dataset.delroute);
        this.refreshSelectors();
        this.updateSidebar();
      });
    });
  },
};

/* overlays.js — Tooltips hover + fiches detail clic */
RailBaron.Overlays = {
  _tooltip: null,
  _detail: null,

  init() {
    const layer = document.getElementById('overlayLayer');
    // Tooltip
    this._tooltip = document.createElement('div');
    this._tooltip.className = 'tt-box';
    this._tooltip.style.display = 'none';
    layer.appendChild(this._tooltip);
  },

  // --- Tooltip survol noeud ---
  _cargoLabel(r) { const c = RailBaron.CONFIG.CARGO[r]; return c ? c.label : r; },
  _cargoColor(r) { const c = RailBaron.CONFIG.CARGO[r]; return c ? c.color : '#888'; },

  showNodeTooltip(node, gs, screenPos, cssX, cssY) {
    const C = RailBaron.CONFIG;
    const stocks = gs.stocks[node.name];
    const stocked = Object.entries(stocks).filter(([,v]) => v > 0);

    let html = `<div class="tt-name">${node.name}</div>`;
    html += `<div class="tt-row"><span>${node.type}</span></div>`;

    // Production
    if (node.type === 'city') {
      html += `<div class="mini" style="margin-top:2px">Produit: Passagers, Courrier</div>`;
    } else if (node.produces) {
      html += `<div class="mini" style="margin-top:2px">Produit: ${this._cargoLabel(node.produces)}</div>`;
    }

    // Consommation
    if (node.consumes && node.consumes.length) {
      html += `<div class="mini">Demande: ${node.consumes.map(r => this._cargoLabel(r)).join(', ')}</div>`;
    }
    if (node.type === 'city') {
      html += `<div class="mini">Pop: ${node.pop || '?'}</div>`;
    }

    // Stocks
    if (stocked.length) {
      html += '<div style="margin-top:4px">';
      for (const [r, v] of stocked.slice(0, 5)) {
        html += `<span class="tt-resource" style="background:${this._cargoColor(r)}"></span>${this._cargoLabel(r)}: ${v} `;
      }
      if (stocked.length > 5) html += '...';
      html += '</div>';
    }

    this._tooltip.innerHTML = html;
    this._tooltip.style.display = 'block';

    let left = cssX + 16;
    let top = cssY + 12;
    const layer = document.getElementById('overlayLayer');
    const maxW = layer.clientWidth;
    const maxH = layer.clientHeight;
    if (left + 240 > maxW) left = cssX - 250;
    if (top + 140 > maxH) top = cssY - 150;
    this._tooltip.style.left = left + 'px';
    this._tooltip.style.top = top + 'px';
  },

  hideTooltip() {
    if (this._tooltip) this._tooltip.style.display = 'none';
  },

  // --- Fiche detail noeud (clic long) ---
  showNodeDetail(node, gs) {
    this.closeDetail();
    const C = RailBaron.CONFIG;
    const stocks = gs.stocks[node.name];
    const stocked = Object.entries(stocks).filter(([,v]) => v > 0);

    let body = `<p><strong>Type:</strong> ${node.type}</p>`;
    if (node.type === 'city') {
      body += '<p><strong>Produit:</strong> Passagers, Courrier</p>';
      body += `<p><strong>Population:</strong> ${node.pop || '?'}</p>`;
    } else if (node.produces) {
      body += `<p><strong>Produit:</strong> ${this._cargoLabel(node.produces)}</p>`;
    }
    if (node.consumes && node.consumes.length) {
      body += `<p><strong>Demande:</strong> ${node.consumes.map(r => this._cargoLabel(r)).join(', ')}</p>`;
    }
    if (node.prodRate) body += `<p class="mini">Taux: ${node.prodRate}x</p>`;

    // Station built?
    const st = gs.stations.find(s => s.nodeName === node.name);
    if (st) {
      body += `<p><strong>Station:</strong> ${C.STATION_SIZES[st.size].label}</p>`;
      if (st.doubleRateUntil && st.doubleRateUntil > gs.turn) body += '<p class="good">Tarifs doubles (periode en cours)</p>';
      const upgs = Object.keys(st.upgrades).filter(k => st.upgrades[k]);
      if (upgs.length) body += `<p class="mini">Equipements: ${upgs.map(k => C.STATION_UPGRADES[k].label).join(', ')}</p>`;
    }

    if (stocked.length) {
      body += '<p><strong>Stocks:</strong></p><div style="margin-left:8px">';
      for (const [r, v] of stocked) {
        body += `<div class="tt-row"><span><span class="swatch" style="background:${this._cargoColor(r)};display:inline-block;width:9px;height:9px;vertical-align:middle"></span> ${this._cargoLabel(r)}</span> <span>${v}</span></div>`;
      }
      body += '</div>';
    }

    this._detail = this._buildDetailPanel(node.name, body);
    document.getElementById('overlayLayer').appendChild(this._detail);
  },

  // --- Fiche detail train (clic sur un train) ---
  showTrainDetail(train, gs, camera, canvas) {
    this.closeDetail();
    const C = RailBaron.CONFIG;
    const route = gs.routes.find(r => r.id === train.routeId);
    const routeName = route ? route.name : '?';
    const consistList = train.consist ? Object.entries(train.consist).map(([r, n]) => `${n}x${(C.CARGO[r] || {}).label || r}`).join(', ') : '?';
    const loadedList = train.wagonsLoaded ? Object.entries(train.wagonsLoaded).filter(([,v]) => v > 0).map(([r, v]) => `${v}x${(C.CARGO[r] || {}).label || r}`).join(', ') || 'vide' : '?';

    let body = `<p><strong>Route:</strong> ${routeName}</p>`;
    body += `<p><strong>Consist:</strong> ${consistList}</p>`;
    body += `<p><strong>Charge:</strong> ${loadedList}</p>`;
    body += `<p><strong>Arret:</strong> ${route ? route.stops[train.currentStopIndex] : '?'} · ${train.state}</p>`;
    body += `<p><strong>Type:</strong> ${train.trainType === 'limited' ? 'Limited (express)' : 'Local'} | ${train.status}</p>`;
    body += `<p><strong>Recettes mois:</strong> ${RailBaron.money(train.monthlyRevenue)}</p>`;
    body += `<p><strong>Profit total:</strong> ${RailBaron.money(train.lifetimeProfit)}</p>`;

    this._detail = this._buildDetailPanel(`Train ${train.id}`, body);
    document.getElementById('overlayLayer').appendChild(this._detail);
  },

  closeDetail() {
    if (this._detail) {
      this._detail.remove();
      this._detail = null;
    }
  },

  // --- Rapport financier ---
  showFinancialReport(gs) {
    this.closeDetail();
    const C = RailBaron.CONFIG;
    const hist = gs.financialHistory || [];
    const current = hist.length ? hist[hist.length - 1] : null;

    // Mois en cours
    let body = '<h3 style="margin-bottom:6px">Mois en cours</h3>';
    if (current) {
      body += `<div class="tt-row"><span>Recettes</span><span class="good">+${RailBaron.money(current.revenue)}</span></div>`;
      body += `<div class="tt-row"><span>Entretien</span><span class="bad">-${RailBaron.money(current.upkeep)}</span></div>`;
      body += `<div class="tt-row"><span>Interets</span><span class="bad">-${RailBaron.money(current.interest)}</span></div>`;
      body += `<div class="tt-row"><strong>Net</strong><span><strong>${RailBaron.money(current.net)}</strong></span></div>`;
    } else { body += '<p class="mini">En attente du premier mois...</p>'; }

    // Par route (agrege depuis les trains du snapshot)
    if (current && current.trains.length) {
      body += '<h3 style="margin:10px 0 6px">Par route (mois)</h3>';
      const byRoute = {};
      for (const ts of current.trains) {
        const key = ts.routeName || ts.id;
        if (!byRoute[key]) byRoute[key] = { revenue: 0, deliveries: 0 };
        byRoute[key].revenue += ts.revenue;
        byRoute[key].deliveries += ts.deliveries;
      }
      for (const [key, data] of Object.entries(byRoute)) {
        body += `<div class="tt-row"><span>${key}</span><span>${RailBaron.money(data.revenue)} (${data.deliveries} liv.)</span></div>`;
      }
    }

    // Par train
    body += '<h3 style="margin:10px 0 6px">Par train</h3>';
    if (gs.trains.length) {
      for (const t of gs.trains) {
        const stLabels = { active: '', paused: '[PAUSE]', on_demand: '[DEM.]' };
        const st = stLabels[t.status] || '';
        const route = gs.routes.find(r => r.id === t.routeId);
        const rtName = route ? route.name : '?';
        const consistStr = t.consist ? Object.entries(t.consist).map(([r, n]) => `${n}x${(RailBaron.CONFIG.CARGO[r] || {}).label || r}`).join(', ') : '';
        body += `<div class="tt-row"><span>${t.id} ${st} ${consistStr}<br><span class="mini">${rtName}</span></span><span>${RailBaron.money(t.monthlyRevenue)}<br><span class="mini">vie: ${RailBaron.money(t.lifetimeProfit)}</span></span></div>`;
      }
    } else { body += '<p class="mini">Aucun train.</p>'; }

    // Annee precedente
    const prevYear = gs.currentYear - 1;
    const prevYearMonths = hist.filter(h => h.year === prevYear);
    if (prevYearMonths.length) {
      const pyRev = prevYearMonths.reduce((s, h) => s + h.revenue, 0);
      const pyNet = prevYearMonths.reduce((s, h) => s + h.net, 0);
      body += `<h3 style="margin:10px 0 6px">Annee precedente (${prevYear})</h3>`;
      body += `<div class="tt-row"><span>Recettes</span><span>${RailBaron.money(pyRev)}</span></div>`;
      body += `<div class="tt-row"><span>Resultat net</span><span>${RailBaron.money(pyNet)}</span></div>`;
    }

    // Dette
    body += '<h3 style="margin:10px 0 6px">Dette</h3>';
    body += `<div class="tt-row"><span>Emprunts</span><span>${RailBaron.money(gs.totalDebt)}</span></div>`;
    body += `<div class="tt-row"><span>Capital</span><span>${RailBaron.money(gs.cash)}</span></div>`;
    body += `<div class="tt-row"><span>Climat eco</span><span>${C.ECONOMIC_STATES[gs.economicState].label}</span></div>`;

    this._detail = this._buildDetailPanel('Rapport Financier', body);
    document.getElementById('overlayLayer').appendChild(this._detail);
  },

  _buildDetailPanel(title, bodyHtml) {
    const wrap = document.createElement('div');
    wrap.className = 'detail-overlay';
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) this.closeDetail();
    });

    const panel = document.createElement('div');
    panel.className = 'detail-panel';
    panel.innerHTML = `
      <div class="detail-header">
        <span class="detail-title">${title}</span>
        <button class="detail-close">&times;</button>
      </div>
      <div class="detail-body">${bodyHtml}</div>
    `;
    panel.querySelector('.detail-close').addEventListener('click', () => this.closeDetail());
    wrap.appendChild(panel);
    return wrap;
  }
};

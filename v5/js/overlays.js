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
    const res = C.CARGO[train.resource] || C.RESOURCES[train.resource] || { label: train.resource };

    let body = `<p><strong>Ressource:</strong> ${res.label}</p>`;
    body += `<p><strong>Ligne:</strong> ${train.from} → ${train.to}</p>`;
    body += `<p><strong>Wagons:</strong> ${train.wagons}/${train.maxWagons}</p>`;
    body += `<p><strong>Etat:</strong> ${train.state}</p>`;
    body += `<p><strong>Type:</strong> ${train.trainType === 'limited' ? 'Limited (express)' : 'Local'}</p>`;
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

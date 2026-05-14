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
  showNodeTooltip(node, gs, screenPos, canvas) {
    const C = RailBaron.CONFIG;
    const stocks = gs.stocks[node.name];
    const stocked = Object.entries(stocks).filter(([,v]) => v > 0);

    let html = `<div class="tt-name">${node.name}</div>`;
    html += `<div class="tt-row"><span>${node.type}</span></div>`;
    if (stocked.length) {
      html += '<div style="margin-top:4px">';
      for (const [r, v] of stocked.slice(0, 5)) {
        html += `<span class="tt-resource" style="background:${C.RESOURCES[r].color}"></span>${C.RESOURCES[r].label}: ${v} `;
      }
      if (stocked.length > 5) html += '...';
      html += '</div>';
    }
    if (node.produces.length) {
      html += `<div class="mini" style="margin-top:2px">Produit: ${node.produces.map(r => C.RESOURCES[r].label).join(', ')}</div>`;
    }
    if (node.demands.length) {
      html += `<div class="mini">Demande: ${node.demands.map(r => C.RESOURCES[r].label).join(', ')}</div>`;
    }

    this._tooltip.innerHTML = html;
    this._tooltip.style.display = 'block';

    // Position : a cote du curseur, ajuste pour rester dans le canvas
    const r = canvas.getBoundingClientRect();
    let left = screenPos.x + 16;
    let top = screenPos.y + 12;
    if (left + 240 > r.width) left = screenPos.x - 250;
    if (top + 120 > r.height) top = screenPos.y - 130;
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
    if (node.produces.length) body += `<p><strong>Produit:</strong> ${node.produces.map(r => C.RESOURCES[r].label).join(', ')}</p>`;
    if (node.demands.length) body += `<p><strong>Demande:</strong> ${node.demands.map(r => C.RESOURCES[r].label).join(', ')}</p>`;
    if (stocked.length) {
      body += '<p><strong>Stocks:</strong></p><div style="margin-left:8px">';
      for (const [r, v] of stocked) {
        body += `<div class="tt-row"><span><span class="swatch" style="background:${C.RESOURCES[r].color};display:inline-block;width:9px;height:9px;vertical-align:middle"></span> ${C.RESOURCES[r].label}</span> <span>${v}</span></div>`;
      }
      body += '</div>';
    }
    body += `<p class="mini" style="margin-top:8px">Taux production: ${node.prodRate}x</p>`;

    this._detail = this._buildDetailPanel(node.name, body);
    document.getElementById('overlayLayer').appendChild(this._detail);
  },

  // --- Fiche detail train (clic sur un train) ---
  showTrainDetail(train, gs, camera, canvas) {
    this.closeDetail();
    const C = RailBaron.CONFIG;
    const res = C.RESOURCES[train.resource];

    let body = `<p><strong>Ressource:</strong> ${res.label}</p>`;
    body += `<p><strong>Ligne:</strong> ${train.from} → ${train.to}</p>`;
    body += `<p><strong>Wagons:</strong> ${train.wagons}/${train.maxWagons}</p>`;
    body += `<p><strong>Etat:</strong> ${train.state}</p>`;
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

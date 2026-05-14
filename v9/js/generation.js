/* generation.js — V9 : generation procedurale (Perlin noise, rivieres A*, ressources, villes) */
RailBaron.Generation = {

  generate(gs, seed) {
    const C = RailBaron.CONFIG;
    if (!seed || seed === 0) seed = Date.now() % 100000;
    gs.seed = seed;

    const perlin = this._createPerlin(seed);
    this._generateTerrain(gs, perlin);
    this._generateRivers(gs);
    this._generateResources(gs, perlin);
    this._generateCities(gs);
    this._generateIndustries(gs);
    this._finalizeCities(gs);

    gs.addLog('Carte generee (seed: ' + seed + '). ' +
      C.GRID_COLS + 'x' + C.GRID_ROWS + ' tuiles, ' +
      gs.cities.length + ' villes, ' + gs.industries.length + ' industries.');
  },

  // ================================================================
  // PERLIN NOISE
  // ================================================================

  _createPerlin(seed) {
    const rng = this._seededRNG(seed);
    const perm = new Uint8Array(512);
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) base[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = base[i & 255];

    const grad2 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [0.707, 0.707], [-0.707, 0.707], [0.707, -0.707], [-0.707, -0.707]
    ];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    const dot = (g, x, y) => g[0] * x + g[1] * y;

    const noise2D = (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x), yf = y - Math.floor(y);
      const u = fade(xf), v = fade(yf);
      const p = perm;
      const a = p[p[X] + Y], b = p[p[X + 1] + Y];
      const c = p[p[X] + Y + 1], d = p[p[X + 1] + Y + 1];
      return lerp(
        lerp(dot(grad2[a % 12], xf, yf), dot(grad2[b % 12], xf - 1, yf), u),
        lerp(dot(grad2[c % 12], xf, yf - 1), dot(grad2[d % 12], xf - 1, yf - 1), u), v);
    };

    return {
      noise2D,
      octave(x, y, octaves = 6, persistence = 0.5, lacunarity = 2.0) {
        let value = 0, amplitude = 1, frequency = 1;
        for (let i = 0; i < octaves; i++) {
          value += noise2D(x * frequency, y * frequency) * amplitude;
          amplitude *= persistence;
          frequency *= lacunarity;
        }
        return value;
      }
    };
  },

  _seededRNG(seed) {
    let s = seed | 0;
    return function() {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },

  // ================================================================
  // TERRAIN
  // ================================================================

  _generateTerrain(gs, perlin) {
    const C = RailBaron.CONFIG;
    for (let col = 0; col < C.GRID_COLS; col++) {
      for (let row = 0; row < C.GRID_ROWS; row++) {
        const nx = col / C.GRID_COLS, ny = row / C.GRID_ROWS;
        const raw = perlin.octave(nx * 7, ny * 5, 6, 0.5, 2.0);
        const edgeDist = Math.min(nx, 1 - nx, ny, 1 - ny);
        let e;
        if (edgeDist < 0.04) {
          e = (edgeDist / 0.04) * 8;
        } else if (edgeDist < 0.07) {
          const t = (edgeDist - 0.04) / 0.03;
          e = 8 + t * ((raw + 0.65) / 1.3 * 100 - 8);
        } else {
          e = (raw + 0.65) / 1.3 * 100;
        }
        e = Math.round(Math.max(0, Math.min(100, e)));
        gs.tiles[col][row].elevation = e;
        gs.tiles[col][row].terrain = this._elevationToTerrain(e);
      }
    }
  },

  _elevationToTerrain(elev) {
    if (elev <= 15) return 'water';
    if (elev <= 25) return 'swamp';
    if (elev <= 45) return 'plains';
    if (elev <= 65) return 'forest';
    if (elev <= 80) return 'hills';
    return 'mountains';
  },

  // ================================================================
  // RIVIERES : A* depuis des sommets vers l'ocean
  // ================================================================

  _neighbors8: [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]],

  _generateRivers(gs) {
    const C = RailBaron.CONFIG;

    // Trouver des sommets bien espaces
    const peaks = [];
    for (let col = 2; col < C.GRID_COLS - 2; col++) {
      for (let row = 2; row < C.GRID_ROWS - 2; row++) {
        if (gs.tiles[col][row].terrain === 'water') continue;
        if (gs.tiles[col][row].elevation < 55) continue;
        let isPeak = true;
        for (const [dc, dr] of this._neighbors8) {
          const nc = col + dc, nr = row + dr;
          if (nc >= 0 && nc < C.GRID_COLS && nr >= 0 && nr < C.GRID_ROWS &&
              gs.tiles[nc][nr].elevation > gs.tiles[col][row].elevation) {
            isPeak = false; break;
          }
        }
        if (isPeak) peaks.push({ col, row, elev: gs.tiles[col][row].elevation });
      }
    }
    peaks.sort((a, b) => b.elev - a.elev);

    const minDist = 35;
    const sources = [];
    for (const p of peaks) {
      let ok = true;
      for (const s of sources) {
        if (Math.hypot(p.col - s.col, p.row - s.row) < minDist) { ok = false; break; }
      }
      if (ok) { sources.push(p); if (sources.length >= 15) break; }
    }

    // Tracer chaque source vers l'ocean avec A*
    const riverSet = new Set();
    const allPaths = [];

    for (const src of sources) {
      if (riverSet.has(`${src.col},${src.row}`)) continue;
      const path = this._astarToOcean(gs, src.col, src.row, riverSet);
      if (!path || path.length < 10) continue;
      allPaths.push(path);
      for (const p of path) riverSet.add(`${p.col},${p.row}`);
    }

    // Marquer les tuiles riviere
    let riverTiles = 0;
    for (const path of allPaths) {
      for (let i = 0; i < path.length; i++) {
        const { col, row } = path[i];
        const t = i / path.length;
        const width = t > 0.85 ? 3 : t > 0.6 ? 2 : 1;

        if (gs.tiles[col][row].terrain !== 'water') {
          gs.tiles[col][row].terrain = 'water';
          gs.tiles[col][row].elevation = Math.max(0, gs.tiles[col][row].elevation - 8);
          gs.tiles[col][row].building = null;
          gs.tiles[col][row].resource = null;
          riverTiles++;
        }
        for (let w = 1; w < width; w++) {
          for (const [dc, dr] of [[0,1],[0,-1],[1,0],[-1,0]]) {
            const nc = col + dc * w, nr = row + dr * w;
            if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
            const nt = gs.tiles[nc][nr];
            if (nt.terrain !== 'water' && nt.terrain !== 'mountains') {
              nt.terrain = 'water';
              nt.elevation = Math.max(0, nt.elevation - 5);
              nt.building = null; nt.resource = null;
              riverTiles++;
            }
          }
        }
      }
    }
    gs.addLog(allPaths.length + ' fleuves (A*), ' + riverTiles + ' tuiles.');
  },

  /** A* depuis (sc,sr) vers l'ocean ou une riviere existante */
  _astarToOcean(gs, sc, sr, riverSet) {
    const C = RailBaron.CONFIG;
    const key = (c, r) => c + ',' + r;
    const startKey = key(sc, sr);

    const h = (c, r) => Math.min(c, C.GRID_COLS - 1 - c, r, C.GRID_ROWS - 1 - r);

    const closed = new Map();
    closed.set(startKey, { g: 0, prev: null });

    // File de priorite manuelle (tas binaire serait mieux mais plus long)
    let open = [{ col: sc, row: sr, g: 0, f: h(sc, sr) }];

    let found = null;
    const maxIter = 20000;
    let iter = 0;

    while (open.length > 0 && iter++ < maxIter) {
      // Extraire le meilleur
      let bestIdx = 0;
      for (let i = 1; i < open.length; i++) {
        if (open[i].f < open[bestIdx].f) bestIdx = i;
      }
      const cur = open[bestIdx];
      open.splice(bestIdx, 1);

      const ck = key(cur.col, cur.row);

      // Arrivee ?
      if (gs.tiles[cur.col][cur.row].terrain === 'water' ||
          riverSet.has(ck) ||
          cur.col <= 1 || cur.col >= C.GRID_COLS - 2 ||
          cur.row <= 1 || cur.row >= C.GRID_ROWS - 2) {
        found = cur;
        break;
      }

      const curElev = gs.tiles[cur.col][cur.row].elevation;

      for (const [dc, dr] of this._neighbors8) {
        const nc = cur.col + dc, nr = cur.row + dr;
        if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
        const nk = key(nc, nr);

        const nElev = gs.tiles[nc][nr].elevation;
        const diff = nElev - curElev;

        // Cout : descente = 1, plat = 3, montee = 3 + diff*0.5
        let cost = diff <= 0 ? 1 : 3 + diff * 0.5;
        // Bonus "tout droit" (evite les zigzags)
        if (cur.parent) {
          const pdc = cur.col - cur.parent.col;
          const pdr = cur.row - cur.parent.row;
          if (dc === pdc && dr === pdr) cost *= 0.5;
        }
        const ng = cur.g + cost;

        const prev = closed.get(nk);
        if (prev && prev.g <= ng) continue;

        closed.set(nk, { g: ng, parent: { col: cur.col, row: cur.row } });
        open.push({ col: nc, row: nr, g: ng, f: ng + h(nc, nr), parent: { col: cur.col, row: cur.row } });
      }
    }

    if (!found) return null;

    // Reconstruire le chemin
    const path = [];
    let node = found;
    while (node) {
      path.unshift({ col: node.col, row: node.row });
      const entry = closed.get(key(node.col, node.row));
      node = entry ? entry.parent : null;
    }
    return path.length >= 10 ? path : null;
  },

  // ================================================================
  // RESSOURCES NATURELLES
  // ================================================================

  _generateResources(gs, perlin) {
    const C = RailBaron.CONFIG;
    const rng = this._seededRNG(gs.seed + 2000);
    const resNoise = this._createPerlin(gs.seed + 3000);

    const terrainResources = {
      plains: ['grain', 'oil'], forest: ['lumber'],
      hills: ['coal', 'iron_ore'], mountains: ['coal', 'iron_ore', 'oil'],
      swamp: ['oil', 'grain'], desert: ['oil'], water: ['oil']
    };

    for (let col = 0; col < C.GRID_COLS; col++) {
      for (let row = 0; row < C.GRID_ROWS; row++) {
        const tile = gs.tiles[col][row];
        if (tile.terrain === 'water') continue;
        const resources = terrainResources[tile.terrain];
        if (!resources || resources.length === 0) continue;

        const n = resNoise.octave(col / 15, row / 15, 3, 0.5, 2.0);
        const threshold = tile.terrain === 'mountains' ? 0.15 :
                          tile.terrain === 'hills' ? 0.20 :
                          tile.terrain === 'forest' ? 0.22 : 0.30;

        if (n > threshold) {
          tile.resource = resources[Math.floor(rng() * resources.length)];
          tile.resourceAmount = Math.round(30 + rng() * 70);
        }
      }
    }
  },

  // ================================================================
  // VILLES (Zipf, score multi-criteres, noms inventes)
  // ================================================================

  _generateCities(gs) {
    const C = RailBaron.CONFIG;
    const rng = this._seededRNG(gs.seed + 4000);

    // Candidats : echantillonnage tous les 3 tuiles (perf)
    const candidates = [];
    for (let col = 8; col < C.GRID_COLS - 8; col += 3) {
      for (let row = 8; row < C.GRID_ROWS - 8; row += 3) {
        const tile = gs.tiles[col][row];
        // Seule exclusion : pas sur l'eau (ocean, lac, riviere)
        if (tile.terrain === 'water') continue;

        // Score rapide : fertilité (echantillonnee)
        let fertile = 0, total = 0;
        for (let dc = -12; dc <= 12; dc += 3) {
          for (let dr = -12; dr <= 12; dr += 3) {
            const nc = col + dc, nr = row + dr;
            if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
            const t = gs.tiles[nc][nr].terrain;
            if (t === 'plains' || t === 'forest') fertile++;
            total++;
          }
        }
        const fertility = total > 0 ? fertile / total : 0;

        // Confluence
        let riverCount = 0;
        for (const [dc, dr] of this._neighbors8) {
          const nc = col + dc, nr = row + dr;
          if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
          if (gs.tiles[nc][nr].terrain === 'water' && !this._isOceanTile(gs, nc, nr)) riverCount++;
        }

        // Ressources (echantillonne)
        let resCount = 0;
        for (let dc = -16; dc <= 16; dc += 4) {
          for (let dr = -16; dr <= 16; dr += 4) {
            const nc = col + dc, nr = row + dr;
            if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
            if (gs.tiles[nc][nr].resource) resCount++;
          }
        }

        const coastBonus = (!this._isOceanTile(gs, col, row) &&
          (col <= C.GRID_COLS * 0.08 || col >= C.GRID_COLS * 0.92 ||
           row <= C.GRID_ROWS * 0.08 || row >= C.GRID_ROWS * 0.92)) ? 2 : 0;

        // Penalite montagne (forte pente = difficile a batir)
        const mountainPenalty = tile.terrain === 'mountains' ? 4 : 0;

        // Eau = bonus modere (pour laisser des villes seches exister)
        const waterBonus = riverCount > 0 ? 2 + riverCount * 1 : 0;

        const score = fertility * 4 + waterBonus +
                      resCount * 0.3 + coastBonus + rng() * 1.0 - mountainPenalty;
        candidates.push({ col, row, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const minDist = Math.round((C.GRID_COLS + C.GRID_ROWS) / 14);
    const maxCities = 15;
    const placed = [];
    gs.cities = [];

    for (const c of candidates) {
      let tooClose = false;
      for (const p of placed) {
        if (Math.hypot(c.col - p.col, c.row - p.row) < minDist) { tooClose = true; break; }
      }
      if (tooClose) continue;
      placed.push(c);
      if (placed.length >= maxCities) break;
    }

    placed.sort((a, b) => b.score - a.score);

    for (let i = 0; i < placed.length; i++) {
      const c = placed[i];
      const rank = i + 1;
      const pop = Math.max(2, Math.round(25 / rank));

      // Verifier : pas sur l'eau, pas entierement encerclee d'eau (ile)
      const tt = gs.tiles[c.col][c.row];
      if (tt.terrain === 'water') { rejectedWater++; continue; }

      let waterNeighbors = 0, totalNeighbors = 0;
      for (const [dc, dr] of this._neighbors8) {
        const nc = c.col + dc, nr = c.row + dr;
        if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
        totalNeighbors++;
        if (gs.tiles[nc][nr].terrain === 'water') waterNeighbors++;
      }
      if (totalNeighbors > 0 && waterNeighbors >= totalNeighbors) continue; // ile

      gs.cities.push({
        id: 'city_' + i,
        name: this._generateCityName(gs.seed + 6000 + i),
        col: c.col, row: c.row,
        population: pop,
        industryCount: 0,
        consumes: this._cityConsumes(pop)
      });
    }
  },

  _cityConsumes(pop) {
    if (pop >= 15) return ['goods', 'food', 'steel', 'textiles', 'petroleum'];
    if (pop >= 8)  return ['goods', 'food', 'steel', 'textiles'];
    if (pop >= 4)  return ['goods', 'food', 'steel'];
    return ['goods', 'food'];
  },

  _isOceanTile(gs, col, row) {
    const C = RailBaron.CONFIG;
    const margin = Math.round(C.GRID_COLS * 0.05);
    if (col <= margin || col >= C.GRID_COLS - 1 - margin) return true;
    if (row <= margin || row >= C.GRID_ROWS - 1 - margin) return true;
    return false;
  },

  _generateCityName(seed) {
    const rng = this._seededRNG(seed);
    const prefixes = ['Mont','Val','Beau','Cour','Pont','Fert','Gran','Bois','Roche','Font','Bel','Champ','Plai','Clair'];
    const starts   = ['br','c','d','fl','gr','l','m','p','r','s','t','v','char','mar','tr'];
    const vowels   = ['a','e','i','o','u','é','è','ou','an','in','on'];
    const ends     = ['l','r','s','t','n','c','mont','ville','val','court','font','bourg'];
    if (rng() < 0.6) {
      return prefixes[Math.floor(rng() * prefixes.length)] + ends[Math.floor(rng() * ends.length)];
    }
    const s = starts[Math.floor(rng() * starts.length)];
    const v = vowels[Math.floor(rng() * vowels.length)];
    const e = ends[Math.floor(rng() * ends.length)];
    return s.charAt(0).toUpperCase() + s.slice(1) + v + e;
  },

  _finalizeCities(gs) {
    const C = RailBaron.CONFIG;
    for (const city of gs.cities) {
      const baseSize = Math.max(2, 2 + Math.floor(city.population / 4));
      const indBonus = Math.min(2, Math.floor((city.industryCount || 0) / 2));
      city.size = baseSize + indBonus;

      for (let dc = 0; dc < city.size; dc++) {
        for (let dr = 0; dr < city.size; dr++) {
          const tc = city.col + dc, tr = city.row + dr;
          if (tc < C.GRID_COLS && tr < C.GRID_ROWS) {
            gs.tiles[tc][tr].building = 'city';
            gs.tiles[tc][tr].structure = city.id;
            gs.tiles[tc][tr].owner = null;
          }
        }
      }
    }
  },

  // ================================================================
  // INDUSTRIES
  // ================================================================

  _generateIndustries(gs) {
    const C = RailBaron.CONFIG;
    const rng = this._seededRNG(gs.seed + 5000);
    gs.industries = [];

    const resourceClusters = this._findResourceClusters(gs);
    const shuffled = resourceClusters.sort(() => rng() - 0.5);

    const industryTypes = [
      { type: 'steel_mill',  needs: ['coal', 'iron_ore'], label: 'Acierie' },
      { type: 'factory',     needs: ['steel'],            label: 'Usine' },
      { type: 'sawmill',     needs: ['lumber'],           label: 'Scierie' },
      { type: 'food_plant',  needs: ['grain'],            label: 'Minoterie' },
      { type: 'refinery',    needs: ['oil'],              label: 'Raffinerie' }
    ];

    for (let i = 0; i < shuffled.length && gs.industries.length < 20; i++) {
      const cluster = shuffled[i];
      const match = industryTypes.find(it => it.needs.includes(cluster.resource));
      if (!match) continue;

      const spot = this._findFreeSpot(gs, cluster.col, cluster.row, 5);
      if (!spot) continue;

      const ind = {
        id: 'ind_' + gs.industries.length,
        type: match.type, label: match.label,
        col: spot.col, row: spot.row,
        size: 1 + Math.floor(rng() * 2)
      };

      for (let dc = 0; dc < ind.size; dc++) {
        for (let dr = 0; dr < ind.size; dr++) {
          const tc = spot.col + dc, tr = spot.row + dr;
          if (tc < C.GRID_COLS && tr < C.GRID_ROWS && !gs.tiles[tc][tr].building) {
            gs.tiles[tc][tr].building = ind.type;
            gs.tiles[tc][tr].structure = ind.id;
          }
        }
      }
      gs.industries.push(ind);
    }

    // Rattacher chaque industrie a la ville la plus proche
    for (const ind of gs.industries) {
      let bestCity = null, bestDist = Infinity;
      for (const city of gs.cities) {
        const dist = Math.abs(ind.col - city.col) + Math.abs(ind.row - city.row);
        if (dist < bestDist) { bestDist = dist; bestCity = city; }
      }
      if (bestCity && bestDist < 35) {
        ind.cityId = bestCity.id;
        bestCity.industryCount = (bestCity.industryCount || 0) + 1;
      }
    }
  },

  _findResourceClusters(gs) {
    const C = RailBaron.CONFIG;
    const visited = new Set();
    const clusters = [];

    for (let col = 0; col < C.GRID_COLS; col++) {
      for (let row = 0; row < C.GRID_ROWS; row++) {
        const key = `${col},${row}`;
        if (visited.has(key)) continue;
        const tile = gs.tiles[col][row];
        if (!tile.resource) continue;

        const queue = [{ col, row }];
        const cluster = [];
        visited.add(key);

        while (queue.length > 0) {
          const { col: c, row: r } = queue.shift();
          cluster.push({ col: c, row: r });
          for (const [dc, dr] of this._neighbors8) {
            const nc = c + dc, nr = r + dr;
            if (nc < 0 || nc >= C.GRID_COLS || nr < 0 || nr >= C.GRID_ROWS) continue;
            const nk = `${nc},${nr}`;
            if (visited.has(nk)) continue;
            const nt = gs.tiles[nc][nr];
            if (nt.resource === tile.resource) {
              visited.add(nk);
              queue.push({ col: nc, row: nr });
            }
          }
        }

        if (cluster.length >= 2) {
          const avgCol = Math.round(cluster.reduce((s, t) => s + t.col, 0) / cluster.length);
          const avgRow = Math.round(cluster.reduce((s, t) => s + t.row, 0) / cluster.length);
          clusters.push({ col: avgCol, row: avgRow, resource: tile.resource, size: cluster.length });
        }
      }
    }
    return clusters;
  },

  _findFreeSpot(gs, col, row, radius) {
    const C = RailBaron.CONFIG;
    for (let r = 1; r <= radius; r++) {
      for (let dc = -r; dc <= r; dc++) {
        for (let dr = -r; dr <= r; dr++) {
          const nc = col + dc, nr = row + dr;
          if (nc < 2 || nc >= C.GRID_COLS - 2 || nr < 2 || nr >= C.GRID_ROWS - 2) continue;
          const tile = gs.tiles[nc][nr];
          if (!tile.building && tile.terrain !== 'water' && tile.terrain !== 'mountains') {
            return { col: nc, row: nr };
          }
        }
      }
    }
    return null;
  }
};

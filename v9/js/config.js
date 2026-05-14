/* config.js — V9 : configuration tuiles, terrains, carte */
const RailBaron = window.RailBaron || {};

RailBaron.CONFIG = {
  // --- Grille ---
  GRID_COLS: 300,
  GRID_ROWS: 200,
  TILE_SIZE: 64,

  get WORLD_W() { return this.GRID_COLS * this.TILE_SIZE; },
  get WORLD_H() { return this.GRID_ROWS * this.TILE_SIZE; },

  // --- Camera ---
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 4.0,
  TICK_MS: 16,

  // --- Terrains ---
  TERRAIN_TYPES: {
    plains:    { label: 'Plaine',   color: '#7aad4f', costMult: 1.0, speedMult: 1.0 },
    forest:    { label: 'Forêt',    color: '#3d6b2e', costMult: 1.5, speedMult: 0.8 },
    hills:     { label: 'Colline',  color: '#b8a87d', costMult: 2.0, speedMult: 0.6 },
    mountains: { label: 'Montagne', color: '#8b7b6b', costMult: 4.0, speedMult: 0.3 },
    water:     { label: 'Eau',      color: '#4a90c4', costMult: 999,  speedMult: 0.5, needsBridge: true },
    swamp:     { label: 'Marais',   color: '#6b8c5c', costMult: 3.0, speedMult: 0.4 },
    desert:    { label: 'Désert',   color: '#d4c898', costMult: 2.5, speedMult: 0.7 }
  },

  // --- Generation procedurale ---
  DEFAULT_SEED: 0,  // 0 = aleatoire (Date.now())

  CITY_NAMES: [
    'Paris', 'Lyon', 'Marseille', 'Lille', 'Bordeaux',
    'Nantes', 'Nancy', 'Rouen', 'Strasbourg', 'Toulouse',
    'Orleans', 'Dijon', 'Amiens', 'Reims', 'Le Havre'
  ],

  // --- Legacy / compat ---
  STARTING_CAPITAL: 1000000,
  START_YEAR: 1890,
  CURRENCY: '€',
  CANVAS_WIDTH: 19200,
  CANVAS_HEIGHT: 12800
};

RailBaron.money = v => {
  const sign = v >= 0 ? '' : '-';
  return sign + RailBaron.CONFIG.CURRENCY + Math.abs(Math.round(v)).toLocaleString('fr-FR');
};

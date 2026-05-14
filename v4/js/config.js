const RailBaron = window.RailBaron || {};

RailBaron.CONFIG = {
  STARTING_CASH: 1500,
  MAX_TURNS: 24,
  TRAIN_COST: 120,
  DEMOLITION_REFUND_RATIO: 0.25,
  EDGE_COST_PER_PX: 0.1,
  EDGE_COST_BASE: 25,

  MAX_STOCK: 14,
  UPKEEP_PER_EDGE: 6,
  UPKEEP_PER_TRAIN: 8,

  LOAD_TIME: 380,
  UNLOAD_TIME: 330,
  TICK_MS: 16,
  BASE_SPEED: 0.0011,
  SPEED_VARIANCE: 0.0004,

  DEFAULT_MAX_WAGONS: 4,
  PASSENGER_MAX_WAGONS: 3,

  BASE_PRODUCTION: 1,
  PASSENGER_PRODUCTION: 2,
  PRODUCTION_VARIANCE: 2,

  MONTH_DURATION_MS: 15000,
  MAX_LOG_ENTRIES: 50,
  CANVAS_WIDTH: 1120,
  CANVAS_HEIGHT: 700,
  NODE_HIT_RADIUS: 18,

  RESOURCES: {
    charbon:   { label: 'Charbon',   color: '#2f2f32', base: 30 },
    bois:      { label: 'Bois',      color: '#6e4a24', base: 24 },
    grain:     { label: 'Grain',     color: '#c9a845', base: 22 },
    acier:     { label: 'Acier',     color: '#9aa4ad', base: 48 },
    textile:   { label: 'Textile',   color: '#b65d8f', base: 44 },
    passagers: { label: 'Passagers', color: '#7fd0d8', base: 36 }
  },

  NODES: [
    { name: 'Lille',              x: 170, y: 120, type: 'city',    produces: ['passagers'], demands: ['acier','grain','bois','textile'],            prodRate: 1.0 },
    { name: 'Rouen',              x: 320, y: 170, type: 'city',    produces: ['passagers'], demands: ['grain','bois','acier'],                       prodRate: 1.0 },
    { name: 'Paris',              x: 470, y: 180, type: 'city',    produces: ['passagers'], demands: ['grain','bois','acier','textile','charbon'],     prodRate: 1.2 },
    { name: 'Nancy',              x: 670, y: 160, type: 'city',    produces: ['passagers'], demands: ['charbon','acier','textile'],                   prodRate: 1.0 },
    { name: 'Lyon',               x: 620, y: 360, type: 'city',    produces: ['passagers'], demands: ['grain','charbon','acier','textile'],            prodRate: 1.1 },
    { name: 'Nantes',             x: 220, y: 360, type: 'city',    produces: ['passagers'], demands: ['grain','bois','textile'],                       prodRate: 1.0 },
    { name: 'Bordeaux',           x: 250, y: 530, type: 'city',    produces: ['passagers'], demands: ['grain','bois','acier'],                         prodRate: 1.0 },
    { name: 'Marseille',          x: 760, y: 540, type: 'city',    produces: ['passagers'], demands: ['grain','acier','textile','charbon'],            prodRate: 1.2 },
    { name: 'Forêt des Ardennes', x: 520, y: 70,  type: 'forest',  produces: ['bois'],      demands: [],                                               prodRate: 2.0 },
    { name: 'Bassin Minier',      x: 760, y: 90,  type: 'coal',    produces: ['charbon'],   demands: [],                                               prodRate: 2.5 },
    { name: 'Plaine de Beauce',   x: 390, y: 300, type: 'farm',    produces: ['grain'],     demands: [],                                               prodRate: 2.5 },
    { name: 'Hauts Fourneaux',    x: 860, y: 260, type: 'steel',   produces: ['acier'],     demands: ['charbon'],                                      prodRate: 1.5 },
    { name: 'Filature du Midi',   x: 860, y: 430, type: 'textile', produces: ['textile'],   demands: ['grain','bois'],                                 prodRate: 1.5 },
    { name: 'Port Atlantique',    x: 110, y: 500, type: 'port',    produces: ['bois'],      demands: ['acier','textile','charbon','grain'],             prodRate: 2.0 }
  ],

  NODE_COLORS: {
    city:    '#f0d37a',
    forest:  '#6e4a24',
    coal:    '#444',
    farm:    '#c9a845',
    steel:   '#9aa4ad',
    textile: '#b55f2a',
    port:    '#87b4c7'
  }
};

RailBaron.findNode = name => RailBaron.CONFIG.NODES.find(n => n.name === name);

RailBaron.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

RailBaron.money = v => `${v >= 0 ? '' : '-'}$${Math.abs(Math.round(v))}`;

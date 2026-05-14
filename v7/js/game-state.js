RailBaron.GameState = class {
  constructor() {
    this.reset();
  }

  reset() {
    const C = RailBaron.CONFIG;
    this.cash = C.STARTING_CAPITAL;
    this.startCash = C.STARTING_CAPITAL;
    this.turn = 1;
    this.tool = 'rail';
    this.speed = 0;
    this.monthTimer = 0;
    this.selectedNode = null;
    this.hoveredNode = null;
    this.edges = [];
    this.routes = [];
    this.trains = [];
    this.stocks = {};
    this.log = [];
    this.financialHistory = [];
    this.loans = [];
    this.stations = [];
    this.economicState = 'normal';
    this._monthsInPeriod = 0;
    this._buildingRoute = null;  // stops en cours de construction
    this._nextEdgeId = 0;
    this._nextTrainId = 0;
    this._nextRouteId = 0;
  }

  get currentYear()  { return RailBaron.CONFIG.START_YEAR + Math.floor((this.turn - 1) / 12); }
  get currentMonth() { return ((this.turn - 1) % 12) + 1; }
  get maxTurns()    { return RailBaron.CONFIG.MAX_GAME_YEARS * 12; }
  get profit()      { return this.cash - this.startCash; }
  get totalDebt()   { return this.loans ? this.loans.reduce((s, l) => s + l.amount, 0) : 0; }

  get isFinished() { return this.turn > this.maxTurns; }

  addLog(msg) {
    this.log.unshift(msg);
    if (this.log.length > RailBaron.CONFIG.MAX_LOG_ENTRIES) {
      this.log.length = RailBaron.CONFIG.MAX_LOG_ENTRIES;
    }
  }

  nextEdgeId()  { return `E${this._nextEdgeId++}`; }
  nextTrainId() { return `T${this._nextTrainId++}`; }

  getNode(name) { return RailBaron.findNode(name); }

  getEdgeById(id) { return this.edges.find(e => e.id === id); }

  edgeExists(nameA, nameB) {
    return this.edges.some(e =>
      (e.a === nameA && e.b === nameB) || (e.a === nameB && e.b === nameA)
    );
  }

  removeTrainsOnEdge(edgeId) {
    this.trains = this.trains.filter(t => t.edgeId !== edgeId);
  }
};

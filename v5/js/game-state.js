RailBaron.GameState = class {
  constructor() {
    this.reset();
  }

  reset() {
    const C = RailBaron.CONFIG;
    this.cash = C.STARTING_CASH;
    this.startCash = C.STARTING_CASH;
    this.turn = 1;
    this.tool = 'rail';
    this.speed = 0;
    this.monthTimer = 0;
    this.selectedNode = null;
    this.hoveredNode = null;
    this.edges = [];
    this.trains = [];
    this.prices = {};
    this.stocks = {};
    this.log = [];
    this._nextEdgeId = 0;
    this._nextTrainId = 0;
  }

  get profit() { return this.cash - this.startCash; }

  get isFinished() { return this.turn > RailBaron.CONFIG.MAX_TURNS; }

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

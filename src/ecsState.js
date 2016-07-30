export default class ECSState {
  constructor() {
    this.entities = new Map();
    this.global = {
      entityId: 0
    };
  }
  toJSON() {
    // Build a 'compact' version
    let output = [];
    output.push(this.global);
    for (let entity of this.entities.values()) {
      output.push(entity);
    }
    return output;
  }
  static fromJSON(obj) {
    let state = new ECSState();
    state.global = obj[0];
    for (let i = 1; i < obj.length; ++i) {
      state.entities.set(i, obj[i]);
    }
    return state;
  }
}

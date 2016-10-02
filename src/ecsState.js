export default class ECSState {
  constructor() {
    this.entities = [];
    this.entityQueue = [];
    this.global = {
      entityId: 0
    };
  }
  toJSON() {
    // Build a 'compact' version
    let output = [];
    output.push(this.global);
    output.push(this.entities.filter(v => v != null));
    output.push(this.entityQueue);
    return output;
  }
  static fromJSON(obj) {
    let state = new ECSState();
    state.global = obj[0];
    obj[1].forEach(entity => {
      state.entities[entity.id] = entity;
    });
    state.entityQueue = obj[2];
    return state;
  }
}

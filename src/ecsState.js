export default class ECSState {
  constructor(engine) {
    this.entities = [];
    this.entityQueue = [];
    this.global = {
      entityId: 0
    };
    this.engine = engine;
  }
  entityToJSON(entity) {
    let output = {};
    for (let key in entity) {
      let entry = this.engine.components.store[key];
      if (entry != null && entry.toJSON != null) {
        output[key] = entry.toJSON(entity[key], entity);
      } else {
        output[key] = entity[key];
      }
    }
    return output;
  }
  toJSON() {
    // Build a 'compact' version
    let output = [];
    output.push(this.global);
    output.push(this.entities.filter(v => v != null)
      .map(v => this.entityToJSON(v)));
    output.push(this.entityQueue);
    return output;
  }
}

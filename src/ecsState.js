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
  static fromJSON(obj) {
    let state = new ECSState();
    state.global = obj[0];
    obj[1].forEach(entity => {
      let entityObj = {};
      for (let name in entity) {
        let addHandler = this.actions.entity.add[name];
        if (addHandler) {
          let instance = this.engine.components.getInstance(name);
          let data = entity[name];
          // Why is it here
          if (typeof instance === 'function') {
            entityObj[name] = new instance(data);
          } else if (typeof instance === 'object') {
            entityObj[name] = Object.assign({}, instance, data);
          } else {
            entityObj[name] = data != null ? data : instance;
          }
        } else {
          entityObj[name] = entity;
        }
      }
      state.entities[entity.id] = entityObj;
    });
    state.entityQueue = obj[2];
    return state;
  }
}

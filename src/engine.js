export default class Engine {
  constructor(components, systems) {
    this.running = false;
    this.actions = {};
    this.signals = {};
    this.systems = {};
    // TODO
    this.state = null;

    this.addComponents(components);
    this.addSystems(systems);
  }
  addComponents(components) {
    for (let key in components) {
      this.addComponent(key, components[key]);
    }
  }
  addSystems(systems) {
    for (let key in systems) {
      this.addSystem(key, systems[key]);
    }
  }
  addComponent(name, data) {
    if (this.running) throw new Error('Cannot modify engine while running');
    if (data == null) return;
    // TODO Set up components (in ECS state)
    // Set up signals and actions
    if (data.actions != null) {
      if (this.actions[name] == null) this.actions[name] = {};
      // TODO Should use signal container
      if (this.signals[name] == null) this.signals[name] = {};
      let actions = this.actions[name];
      let signals = this.signals[name];
      for (let actionName in data.actions) {
        let action = data.actions[actionName];
        if (typeof action === 'function') {
          // This is a 'thunk' action
          actions[actionName] = action;
        } else if (action != null && action.exec != null) {
          // If exec is available, run that instead
          actions[actionName] = action.exec(actionName, this, actions, signals);
        } else {
          throw new Error(name + '.' + actionName + ' action is invalid');
        }
      }
    }
    // Done. fair enough
  }
  addSystem(name, data) {
    if (this.running) throw new Error('Cannot modify engine while running');
  }
  loadState(state) {
    if (this.running) throw new Error('Cannot modify engine while running');
    // TODO Should construct ECS state.
    this.state = state;
  }
  getState() {
    // TODO Should call toJSON if ECS has built.
    return this.state;
  }
  start() {

  }
  stop() {

  }
}

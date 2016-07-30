import signal from './util/signal';

export default class Engine {
  constructor(components, systems, builtIn = true) {
    this.running = false;
    this.actions = {};
    this.signals = {};
    this.systems = {};
    // TODO
    this.state = null;

    this.addComponents(components);
    if (builtIn) {
      this.addComponent('external', {
        actions: {
          update: signal(() => {}),
          start: signal(() => {}),
          stop: signal(() => {})
        }
      });
      this.addComponent('entity', {
        actions: {
          add: {
            position: signal(() => {}),
            velocity: signal(() => {})
          },
          create: signal(() => {})
        }
      });
    }
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
      this.addActions(data.actions, actions, signals);
    }
    // Done. fair enough
  }
  addActions(source, actions, signals) {
    for (let actionName in source) {
      let action = source[actionName];
      if (typeof action === 'function') {
        // This is a 'thunk' action
        actions[actionName] = action;
      } else if (action != null && action[Symbol.for('exec')] != null) {
        // If exec is available, run that instead
        actions[actionName] =
          action[Symbol.for('exec')](actionName, this, actions, signals);
      } else if (action != null) {
        actions[actionName] = {};
        signals[actionName] = {};
        this.addActions(action, actions[actionName], signals[actionName]);
      } else {
        throw new Error(name + '.' + actionName + ' action is invalid');
      }
    }
  }
  addSystem(name, data) {
    if (this.running) throw new Error('Cannot modify engine while running');
    if (data == null) return;
    // Systems are not supposed to conflict - try to catch them.
    if (this.systems[name] != null) {
      throw new Error('System ' + name + ' conflicts');
    }
    let system;
    if (typeof data === 'function') {
      // Assume the system is a class (Or a function. doesn't matter actually)
      system = new data(this);
    } else {
      // Otherwise, it'd be a prebuilt object
      system = data;
    }
    // Attach the system object
    this.systems[name] = system;
    if (typeof system.attach === 'function') system.attach(this);
    // If 'hook' object is available, attach them too
    if (system.hooks != null) {
      for (let key in system.hooks) {
        this.attachHook(key, system.hooks[key], this.signals);
      }
    }
  }
  attachHook(name, listener, data) {
    let keywords = name.split(/[.:]/);
    let parent = data;
    let priority = 100;
    keywords.forEach(keyword => {
      if (keyword.indexOf('@') !== -1) {
        let index = keyword.indexOf('@');
        parent = parent[keyword.slice(0, index)];
        priority = parseInt(keyword.slice(index + 1));
        if (isNaN(priority)) {
          throw new Error('Priority must be a number');
        }
      } else {
        parent = parent[keyword];
      }
      if (parent == null) {
        throw new Error('Signal ' + name + ' not found');
      }
    });
    parent.add(listener, priority);
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

import signal from './util/signal';
import ParentSignal from './signal/parentSignal';

export default class BaseEngine {
  constructor(components, systems, builtIn = true) {
    this.running = false;
    this.actions = {};
    this.signals = {};
    this.systems = {};
    this.state = null;

    this.addComponents(components);
    if (builtIn) {
      this.addComponent('external', {
        actions: {
          update: signal(() => {}, func => delta => func('update', delta)),
          start: signal(() => {}, func => () => func('start')),
          stop: signal(() => {}, func => () => func('stop')),
          load: signal(() => {}, func => () => func('load'))
        }
      });
    }
    this.addSystems(systems);
  }
  addComponents(components) {
    if (components == null) return;
    for (let key in components) {
      this.addComponent(key, components[key]);
    }
  }
  addSystems(systems) {
    if (systems == null) return;
    for (let key in systems) {
      this.addSystem(key, systems[key], false);
    }
    // Attach the systems
    for (let key in systems) {
      let system = this.systems[key];
      if (typeof system.attach === 'function') system.attach(this);
      // If 'hook' object is available, attach them too
      if (system.hooks != null) {
        for (let key in system.hooks) {
          this.attachHook(key, system.hooks[key], this.signals);
        }
      }
    }
  }
  addComponent(name, data) {
    if (this.running) throw new Error('Cannot modify engine while running');
    if (data == null) return;
    // Set up signals and actions
    if (data.actions != null) {
      if (this.actions[name] == null) this.actions[name] = {};
      // TODO Should use signal container
      if (this.signals[name] == null) this.signals[name] = {};
      let actions = this.actions[name];
      let signals = this.signals[name];
      this.addActions(data.actions, actions, signals, this.signals);
    }
    // Done. fair enough
  }
  addActions(source, actions, signals, parent) {
    if (signals['*'] == null) {
      let parentSignal = parent['*'];
      let binding;
      let handler = source['*'];
      if (handler != null && parentSignal != null) {
        binding = {
          pre: parentSignal.pre.dispatch.bind(parentSignal.pre),
          post: handler(parentSignal.post.dispatch.bind(parentSignal.post)),
          dispatch: handler(parentSignal.dispatch.bind(parentSignal))
        };
      }
      signals['*'] = new ParentSignal(false, binding && binding.dispatch);
      signals['*'].pre = new ParentSignal(true, binding && binding.pre);
      signals['*'].post = new ParentSignal(true, binding && binding.post);
    }
    for (let actionName in source) {
      if (actionName === '*') continue;
      let action = source[actionName];
      if (typeof action === 'function') {
        // This is a 'thunk' action
        actions[actionName] = action.bind(this);
      } else if (action != null && action[Symbol.for('exec')] != null) {
        // If exec is available, run that instead
        actions[actionName] =
          action[Symbol.for('exec')](actionName, this, actions, signals,
          signals['*']);
      } else if (action != null) {
        if (actions[actionName] == null) actions[actionName] = {};
        if (signals[actionName] == null) signals[actionName] = {};
        this.addActions(action, actions[actionName], signals[actionName],
          signals);
      } else {
        throw new Error(name + '.' + actionName + ' action is invalid');
      }
    }
  }
  addSystem(name, data, attach = true) {
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
    if (attach && typeof system.attach === 'function') system.attach(this);
    if (attach) {
      // If 'hook' object is available, attach them too
      if (system.hooks != null) {
        for (let key in system.hooks) {
          this.attachHook(key, system.hooks[key], this.signals);
        }
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
    this.state = state;
    this.actions.external.load();
  }
  getState() {
    if (this.state && this.state.toJSON) return this.state.toJSON();
    return this.state;
  }
  start() {
    this.actions.external.start();
    this.running = true;
  }
  stop() {
    this.actions.external.stop();
    this.running = false;
  }
  update(delta) {
    this.actions.external.update(delta);
  }
}

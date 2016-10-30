import signalRaw from './util/signalRaw';
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
          update: signalRaw(() => {}, func => args =>
            func(['update'].concat(args))),
          start: signalRaw(() => {}, func => () => func(['start'])),
          stop: signalRaw(() => {}, func => () => func(['stop'])),
          load: signalRaw(([state]) => {
            this.loadState(state);
          }, func => () => func(['load']))
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
          this.attachHook(key, system.hooks[key]);
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
    if (data.globalActions != null) {
      this.addActions(data.globalActions, this.actions, this.signals,
        null, false);
    }
    // Done. fair enough
  }
  addActions(source, actions, signals, parent, createGlob = true) {
    if (signals['*'] == null && createGlob) {
      let parentSignal = parent != null && parent['*'];
      let binding;
      let handler = source['*'];
      if (handler != null && parentSignal != null) {
        binding = {
          pre: parentSignal.pre._dispatch.bind(parentSignal.pre),
          post: handler(parentSignal.post._dispatch.bind(parentSignal.post)),
          dispatch: handler(parentSignal._dispatch.bind(parentSignal))
        };
        binding.dispatch.isEmpty = parentSignal.isEmpty.bind(parentSignal);
        binding.pre.isEmpty = parentSignal.pre.isEmpty.bind(parentSignal.pre);
        binding.post.isEmpty = parentSignal.post.isEmpty
          .bind(parentSignal.post);
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
          this.attachHook(key, system.hooks[key]);
        }
      }
    }
  }
  attachHook(_name, listener, forceRaw = false) {
    let name;

    let raw = _name.charAt(_name.length - 1) === '!';
    if (raw) name = _name.slice(0, -1);
    else name = _name;

    let keywords = name.split(/[.:]/);
    let parent = this.signals;
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
    parent.add(listener, priority, raw || forceRaw);
  }
  detachHook(_name, listener) {
    let name;

    let raw = _name.charAt(_name.length - 1) === '!';
    if (raw) name = _name.slice(0, -1);
    else name = _name;

    let keywords = name.split(/[.:]/);
    let parent = this.signals;
    keywords.forEach(keyword => {
      if (keyword.indexOf('@') !== -1) {
        let index = keyword.indexOf('@');
        parent = parent[keyword.slice(0, index)];
      } else {
        parent = parent[keyword];
      }
      if (parent == null) {
        throw new Error('Signal ' + name + ' not found');
      }
    });
    parent.remove(listener);
  }
  loadState(state) {
    if (this.running) throw new Error('Cannot modify engine while running');
    this.state = state;
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

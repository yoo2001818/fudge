import BaseEngine from './baseEngine';
import ComponentStore from './componentStore';
import ECSState from './ecsState';
import signalRaw from './util/signalRaw';

import FamilySystem from './system/family';

export default class Engine extends BaseEngine {
  constructor(components, systems) {
    super();
    this.components = new ComponentStore();
    this.state = new ECSState(this);
    // Create entity base
    this.addComponent('entity', {
      actions: {
        create: signalRaw(([data, ignoreMissing = false]) => {
          let id;
          if (data.id != null) {
            id = data.id;
          } else if (this.state.entityQueue.length > 0) {
            id = this.state.entityQueue.shift();
          } else {
            id = this.state.global.entityId ++;
          }
          let entity = { id };
          this.state.entities[id] = entity;
          for (let name in data) {
            if (name === 'id') continue;
            let addHandler = this.actions.entity.add[name];
            if (addHandler) {
              addHandler(entity, data[name]);
            } else if (!ignoreMissing) {
              throw new Error('Component ' + name + ' is missing, but was ' +
                'provided in creation data.');
            }
          }
          return entity;
        }),
        delete: signalRaw(([entity]) => {
          for (let name in entity) {
            let removeHandler = this.actions.entity.remove[name];
            if (removeHandler) removeHandler(entity, true);
          }
          this.state.entities[entity.id] = null;
          this.state.entityQueue.push(entity.id);
        })
      }
    });
    this.addComponents(components);
    this.addSystems({
      family: FamilySystem
    });
    this.addSystems(systems);
  }
  addComponent(name, data) {
    super.addComponent(name, data);
    // Set up components (in ECS)
    if (data.component) {
      let entry = this.components.add(name, data.component);
      entry.data = data;
      if (data.toJSON) {
        entry.toJSON = data.toJSON;
      }
      // Set up entity actions
      this.addActions({
        add: {
          [name]: signalRaw(([entity, data]) => {
            let instance = this.components.getInstance(name);
            if (typeof instance === 'function') {
              entity[name] = new instance(data);
            } else if (typeof instance === 'object') {
              entity[name] = Object.assign({}, instance, data);
            } else {
              entity[name] = data != null ? data : instance;
            }
          }, handler => ([entity, data]) => handler([entity, name, data]))
        },
        remove: {
          [name]: signalRaw(([entity, deleting]) => {
            if (entity[name] === undefined) {
              throw new Error('Component ' + name + ' is not added');
            }
            if (!deleting) delete entity[name];
          }, handler => ([entity, deleting]) =>
            handler([entity, name, deleting])
          )
        }
      }, this.actions.entity, this.signals.entity, this.signals);
    }
    // Global initial state
    if (data.global) {
      Object.assign(this.state.global, data.global);
    }
  }
  loadState(data) {
    if (this.running) throw new Error('Cannot modify engine while running');
    this.state = new ECSState(this);
    this.state.global = data[0];
    this.state.entityQueue = data[2];
    data[1].forEach(entity => {
      this.actions.entity.create(entity);
      // state.entities[entity.id] = entityObj;
    });
  }
}

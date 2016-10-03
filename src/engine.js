import BaseEngine from './baseEngine';
import ComponentStore from './componentStore';
import ECSState from './ecsState';
import signalRaw from './util/signalRaw';

import FamilySystem from './system/family';

export default class Engine extends BaseEngine {
  constructor(components, systems) {
    super();
    this.components = new ComponentStore();
    this.state = new ECSState();
    // Create entity base
    this.addComponent('entity', {
      actions: {
        create: signalRaw(([data]) => {
          let id;
          if (this.state.entityQueue.length > 0) {
            id = this.state.entityQueue.shift();
          } else {
            id = this.state.global.entityId ++;
          }
          let entity = { id };
          this.state.entities[id] = entity;
          for (let name in data) {
            this.actions.entity.add[name](entity, data[name]);
          }
          return entity;
        }),
        delete: signalRaw(([entity]) => {
          for (let name in entity) {
            let removeHandler = this.actions.entity.remove[name];
            if (removeHandler) removeHandler(entity);
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
      this.components.add(name, data.component);
      // Set up entity actions
      this.addActions({
        add: {
          [name]: signalRaw(([entity, data]) => {
            let instance = this.components.getInstance(name);
            if (typeof instance === 'function') {
              entity[name] = new instance(data);
            } else {
              entity[name] = Object.assign({}, instance, data);
            }
          }, handler => ([entity, data]) => handler([entity, name, data]))
        },
        remove: {
          [name]: signalRaw(([entity]) => {
            if (entity[name] === undefined) {
              throw new Error('Component ' + name + ' is not added');
            }
            delete entity[name];
          }, handler => ([entity]) => handler([entity, name]))
        }
      }, this.actions.entity, this.signals.entity, this.signals);
    }
  }
  loadState(state) {
    if (this.running) throw new Error('Cannot modify engine while running');
    this.state = ECSState.fromJSON(state);
    this.actions.external.load();
  }
}

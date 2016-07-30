import BaseEngine from './baseEngine';
import ComponentStore from './componentStore';
import signal from './util/signal';

export default class Engine extends BaseEngine {
  constructor(components, systems) {
    super();
    this.components = new ComponentStore();
    this.state = {
      entities: new Map(),
      global: {
        entityId: 0
      }
    };
    // TODO Add entity base
    // actions.entity.create
    // actions.entity.delete
    // actions.entity.add.velocity
    // actions.entity.remove.velocity
    this.addComponent('entity', {
      actions: {
        create: signal(data => {
          let id = this.state.global.entityId ++;
          let entity = { id };
          this.state.entities.set(id, entity);
          for (let name in data) {
            this.actions.entity.add[name](entity, data[name]);
          }
          return entity;
        }),
        delete: signal(entity => {
          for (let name in entity) {
            let removeHandler = this.actions.entity.remove[name];
            if (removeHandler) removeHandler(entity);
          }
          this.state.entities.delete(entity);
        })
      }
    });
    this.addComponents(components);
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
          [name]: signal((entity, data) => {
            let instance = this.components.getInstance(name);
            if (typeof instance === 'function') {
              entity[name] = new instance(data);
            } else {
              entity[name] = Object.assign({}, instance, data);
            }
          }, handler => (entity, data) => handler(entity, name, data))
        },
        remove: {
          [name]: signal(entity => {
            if (entity[name] === undefined) {
              throw new Error('Component ' + name + ' is not added');
            }
            delete entity[name];
          }, handler => (entity) => handler(entity, name))
        }
      }, this.actions.entity, this.signals.entity, this.signals);
    }
  }
}

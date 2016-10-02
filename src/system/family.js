import BitSet from 'beatset';
import Signal from '../signal';

export class Family {
  constructor(id, pattern) {
    this.id = id;
    this.pattern = pattern;
    this.entities = [];
    this.onAdd = new Signal();
    this.onRemove = new Signal();
  }
  match(entityPattern) {
    return entityPattern.contains(this.pattern);
  }
  add(entity) {
    this.entities.push(entity);
    this.onAdd.dispatch(entity);
  }
  remove(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.onRemove.dispatch(entity);
  }
  forEach() {
    this.entities.forEach.apply(this.entities, arguments);
  }
}

export default class FamilySystem {
  constructor(engine) {
    this.engine = engine;
    this._familyId = 0;
    // An array containing all the family registered.
    this.families = [];
    // An 2D array containing family per each component, used to fastly
    // process component addition/removal.
    this.familyComponents = [];
    // An array containing all the bitset for entity's components.
    this.entityComponents = [];
    // An array containing all the bitset for entity's families.
    this.entityFamilies = [];
    this.hooks = {
      'external.load': () => {
        // Clear all the entity cache
        this.entityComponents = [];
        this.entityFamilies = [];
        this.families.forEach(family => {
          family.entities = [];
        });
        // Loop for every entities and families. Welcome to O(n^2)!
        this.engine.state.entities.forEach(entity => {
          if (entity == null) return;
          let components = this.entityComponents[entity.id] =
            this.createBitSet();
          let families = this.entityFamilies[entity.id] = new BitSet();
          // Build components bitset...
          for (let key in entity) {
            if (key === 'id') continue;
            components.set(this.getPos(key));
          }
          // Build families.
          this.families.forEach(family => {
            if (family.match(components)) {
              families.set(family.id);
              family.add(entity);
            }
          });
        });
      },
      'entity.create:post': (data, entity) => {
        // Actually, if the entity has any data, it would have been initialized
        // by entity.add.*. This is used to init entities without data.
        let components = this.entityComponents[entity.id];
        if (components == null) {
          this.entityComponents[entity.id] = this.createBitSet();
          this.entityFamilies[entity.id] = new BitSet();
        }
      },
      'entity.delete': (entity) => {
        let families = this.entityFamilies[entity.id];
        if (families == null) return;
        // Remove from all families
        for (let i = 0; i < this.families.length; ++i) {
          let family = this.families[i];
          if (families.get(family.id)) {
            family.remove(entity);
          }
        }
        // Remove the component keys
        delete this.entityComponents[entity.id];
        delete this.entityFamilies[entity.id];
      },
      'entity.add.*:post': (entity, name) => {
        let components = this.entityComponents[entity.id];
        if (components == null) {
          components = this.entityComponents[entity.id] = this.createBitSet();
          this.entityFamilies[entity.id] = new BitSet();
        }
        let pos = this.getPos(name);
        if (components.get(pos)) return;
        components.set(pos);
        if (this.familyComponents[pos] == null) return;
        this.familyComponents[pos].forEach(family => {
          this.update(entity, family);
        });
      },
      'entity.remove.*': (entity, name) => {
        let components = this.entityComponents[entity.id];
        if (components == null) {
          components = this.entityComponents[entity.id] = this.createBitSet();
        }
        let pos = this.getPos(name);
        if (!components.get(pos)) return;
        components.clear(pos);
        if (this.familyComponents[pos] == null) return;
        this.familyComponents[pos].forEach(family => {
          this.update(entity, family);
        });
      }
    };
  }
  update(entity, family) {
    let components = this.entityComponents[entity.id];
    let families = this.entityFamilies[entity.id];
    let current = family.match(components);
    let previous = families.get(family.id);
    if (current !== previous) {
      families.set(family.id, current);
      if (current) {
        family.add(entity);
      } else {
        family.remove(entity);
      }
    }
  }
  get(...args) {
    let components = args;
    if (Array.isArray(args[0])) components = args[0];
    // Create 'criteria' pattern
    let pattern = this.createBitSet();
    components.forEach(name => {
      pattern.set(this.getPos(name));
    });
    // Find a exactly matching family, then return it. O(n) - we could use
    // hashmap if this becomes a bottleneck (It won't.)
    let oldFamily = this.families.find(o => o.pattern.equals(pattern));
    if (oldFamily) return oldFamily;
    // Create one if it doesn't exist.
    let family = new Family(this._familyId ++, pattern);
    this.families.push(family);
    // Add to familyComponents
    components.forEach(name => {
      let pos = this.getPos(name);
      if (this.familyComponents[pos] == null) {
        this.familyComponents[pos] = [];
      }
      this.familyComponents[pos].push(family);
    });
    // Iterate the entities, and add them if it matches the criteria.
    this.engine.state.entities.forEach(entity => {
      if (entity == null) return;
      let components = this.entityComponents[entity.id];
      let families = this.entityFamilies[entity.id];
      if (family.match(components)) {
        families.set(family.id);
        family.add(entity);
      }
    });
    // All done! return the family object.
    return family;
  }
  createBitSet() {
    return new BitSet(this.engine.components.list.length);
  }
  getPos(component) {
    return this.engine.components.getId(component);
  }
}

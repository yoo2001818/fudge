export default class ComponentStore {
  constructor() {
    this._id = 0;
    this.store = {};
    this.entryList = [];
    this.list = [];
  }
  add(name, instance) {
    let id = this._id ++;
    if (this.store[name] != null) {
      throw new Error('Component ' + name + ' conflicts');
    }
    let entry = { id, instance, name };
    this.store[name] = entry;
    this.entryList.push(entry);
    this.list.push(name);
  }
  getId(name) {
    let entry = this.store[name];
    if (entry == null) throw new Error('Component ' + name + ' is not defined');
    return entry.id;
  }
  getInstance(name) {
    let entry = this.store[name];
    if (entry == null) throw new Error('Component ' + name + ' is not defined');
    return entry.instance;
  }
}

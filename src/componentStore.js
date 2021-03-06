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
    return entry;
  }
  getEntry(name) {
    let entry = this.store[name];
    if (entry == null) throw new Error('Component ' + name + ' is not defined');
    return entry;
  }
  getId(name) {
    return this.getEntry(name).id;
  }
  getInstance(name) {
    return this.getEntry(name).instance;
  }
}

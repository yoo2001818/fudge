# fudge
ECS framework for JavaScript

Fudge is a Entity-Component-System framework that adopts some of
[Flux](https://facebook.github.io/flux/) architecture concepts.
Unlike Flux, there is no centralized 'Dispatcher' - Instead the Engine contains
signal / action hierarchy which can be used to replace Dispatcher, without
creating action object.

# Signal
Signal represents single modification / action happens on the engine.
Each signal have phases and default handler, and it can be used to cancel/modify
original actions, perform additional task, etc.

It has following phases:

- `pre` - Runs before any listeners. Can be used to modify / cancel action.
- (main) - Runs right before executing the handler.
- (handler) - Actually performs data modification, etc.
- `post` - Runs after exeucting the handler.

It also has parents, so signals can go up to the hierarchy.

## Methods

- add(listener, priority, raw, once) - Adds new listener.
- remove(listener) - Removes the listener.
- dispatch(...args) - Dispatch the signal.
- `_dispach(args)` - Dispatch the signal (Accepts an array as argument)
- emit(...args) - Dispatch the signal.
- addRaw(listener, priority) - Same as `add(listener, priority, true)`
- on(listener, priority, raw) - Same as `add`
- once(listener, priority, raw) - Same as `add(listener, priority, raw, true)`

# Action
An action is a function that performs certain task, like moving an entity to
specified position, etc. It may wrap a signal, or it might be a bare function.

# System
A system is an object that can provide useful functions, caches, or listen
to signals and perform side effects. (Such as moving entities)

It can be a function or an object - If a function is given, Fudge will call
it with the engine object: `func(engine)`, and will use return value as the
system. Then, it'll call `attach(engine)` of system object.

It'll automatically register `hooks` of system object to signals following a
schema.

## Hook schema
```js
{
  'hello.world': (a, b) => {}, // References hello.world
  'hello.world:pre': (a, b) => [a, b], // References hello.world pre phase
  'hello.world:post': (a, b) => {}, // References post phase
  'hello.world@100': (a, b) => {}, // References hello.world with 100 priority
  'hello.world:pre@100': (a, b) => [a, b], // pre phase with 100 priority
  // References hello.world, get an array as argument (raw). (It's much faster)
  'hello.world!': ([a, b]) => {},
  // References hello.world pre phase, get an array as argument (raw).
  'hello.world:pre!': a => a,
  'hello.*': (a, b) => {}, // References hello.*
  'a.b.c.d': () => {} // References a.b.c.d
}
```

# Component
A component represents single aspect of an entity, such as position or velocity.
It comes with default data, and actions to use.

```js
import { signal, signalRaw } from 'fudge';

{
  // The default data to use, can be a function (as constructor)
  component: {
    x: 0,
    y: 0
  },
  // The toJSON function, issued when serialization (if exists)
  toJSON: (component, entity) => {x: component.x, y: component.y, a: entity.id},
  // Actions to register
  actions: {
    // Register a signal. It must be wrapped with signalRaw function
    // signalRaw calls the callback with an argument array.
    set: signalRaw(([entity, data]) => {
      entity.pos = data;
    }),
    // signal calls the callback normally.
    set2: signal((entity, data) => {
      entity.pos = data;
    }),
    // 'this' is the engine object, so we can do this:
    set3: signal(function (entity, data) {
      this.actions.position.set2(entity, data);
    }),
    // signal/signalRaw also control parent's arguments.
    // NOTE It uses an array for args
    set3: signal((entity, data) => {
      entity.pos = data;
    }, cb => ([a, b]) => cb(['set', a, b])),
    x: {
      // It can also have hierarchy.
      set: signalRaw(([entity, x]) => {
        entity.pos.x = x;
      })
    },
    // If bare function is specified, it'll be registered as an action, but
    // not a signal.
    // Also, 'this' is the engine object.
    move: function (entity, data) {
      this.actions.position.set2(entity, data);
    }
    // * is used to raise the signal flow to parent, it won't go upper level
    // if * is not specified.
    // 'position.*' would be still usable, but '*' won't receive 'position.*'.
    // It also controls parent's arguments.
    '*': callback => args => callback(['position'].concat(args)),
  }
}
```

# State
The engine state.

- global: Object. The global state.
- entities: Array. The array containing all the entities.

# Entity
An entity contains all the components associated with it.

- id: Number. The entity ID.
- <Component name>: Object. The component.

# Engine
Engine stores / controls all the actions, signals, systems, entities used in
the application.

```js
import { Engine } from 'fudge';
```

## constructor
`new Engine(components, systems)`

Creates new engine. Components and systems are objects.

```js
import { Engine, signalRaw } from 'fudge';
let engine = new Engine({
  position: {
    component: {
      x: 0, y: 0
    },
    actions: {
      set: signalRaw(([entity, x, y]) => {
        entity.position = { x, y };
      }),
      add: function (entity, x, y) {
        this.actions.position.set(entity,
          entity.position.x + x,
          entity.position.y + y
        );
      }
    }
  }
}, {
  move: function (engine) {
    this.family = engine.systems.family.get('position');
    this.hooks = {
      'external.update!': ([delta]) => {
        this.family.forEach(entity => {
          this.engine.actions.position.add(entity, delta, delta);
        })
      }
    };
  }
});
```

## Properties

- running: Boolean.
- actions: Object. An object containing all the actions.
- signals: Object. An object containing all the signals.
- systems: Object. An object containing all the systems.
- components: ComponentStore.
- state: State. The engine state.

## Methods

### addComponents(components)
Registers components to the engine. Engine must be not running.

### addSystems(systems)
Registers systems to the engine. Engine must be not running.

### addComponent(name, component)
Registers component to the engine. Engine must be not running.

### addSystem(name, system)
Registers system to the engine. Engine must be not running.

### getState()
Returns JSON state.

### start()
Starts the engine. (Make it running). Also dispatches `external.start`.

### stop()
Stops the engine. (Stop running). Also dispatches `external.stop`.

### update(delta)
Update the engine. Equals to dispatching `external.update(delta)`.

# Built-in Actions
## external
- load(state) - Loads the state to JSON.
- start() - Start the engine.
- stop() - Stop the engine.
- update(delta) - Update the engine.

## entity
- create(data, ignoreMissing) - Creates an entity with the schema.
- delete(entity) - Deletes the entity.
- add.<Component name>(entity, data) - Add a component to the entity.
- remove.<Component name>(entity) - Removes the component from the entity.

# Built-in Systems
## family
FamilySystem manages lists of entities with specified components efficiently.
It internally stores BitSets of entities and families, and updates the list
when an action has occurred.

- get(component1, component2, ...): Family - Returns new (or existing) Family
  object.

Family object has following properties:

- onAdd: Signal. Issued when an entity is added.
- onRemove: Signal. Issued when an entity is removed.
- entities: Array. An array containing the entities.
- forEach: Function. A delegate function for `entities.forEach`.

# Integrations
- [react-fudge](https://github.com/yoo2001818/react-fudge) -
  React binding for fudge

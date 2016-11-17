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
    // * is used to raise the signal flow to parent, it won't go upper level
    // if * is not specified.
    // 'position.*' would be still usable, but '*' won't receive 'position.*'.
    // It also controls parent's arguments.
    '*': callback => args => callback(['position'].concat(args)),
  }
}
```

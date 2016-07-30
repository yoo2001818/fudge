import Engine from '../src/engine';
import signal from '../src/util/signal';

let engine = new Engine({
  position: {
    component: {x: 0, y: 0},
    actions: {
      set: signal((entity, x, y) => {
        entity.position.x = x;
        entity.position.y = y;
      }),
      add: (entity, x, y) => {
        engine.actions.position.set(entity,
          entity.position.x + x,
          entity.position.y + y);
      }
    }
  }
}, {
  position: {
    hooks: {
      'external.update': (delta) => {
        engine.systems.family.get('position').forEach(entity => {
          engine.actions.position.add(entity, delta, 0);
          // with sugar: entity.position.add(delta, 0);
        });
      },
      // One can use hooks to redirect signals
      'entity.add.position:post@150': (entity) => {
        engine.actions.position.set(entity,
          entity.position.x, entity.position.y);
      }
    }
  }
});

// Components and systems can be defined like this in 'maintenance mode'
engine.addComponent('velocity', {
  component: {x: 0, y: 0},
  actions: {
    set: signal((entity, x, y) => {
      entity.velocity.x = x;
      entity.velocity.y = y;
    }),
    add: (entity, x, y) => {
      engine.actions.velocity.set(entity,
        entity.velocity.x + x,
        entity.velocity.y + y);
    }
  }
});
engine.addSystem('init', {
  hooks: {
    'external.start': () => {
      console.log('start');
      let entity = engine.actions.entity.create({
        position: {}
      });
      engine.actions.entity.add.velocity(entity, {
        x: 2, y: 3
      });
      console.log(entity);
      // Or...
      // entity.add('velocity', {x: 2, y: 3});
    }
  }
});

console.log(engine);

// Load config data
/* engine.loadConfig({
  position: {
    xMove: 1
  }
}); */
/*
engine.loadState({
  entities: [{
    id: 0,
    position: {
      x: 0,
      y: 0
    }
  }]
});
*/
// Attach the system objects and start the engine.
engine.start();
engine.actions.external.start();

engine.signals.position.set.on((entity, x, y) => {
  console.log(entity, x, y);
});

// engine.actions.external.update(13);
console.log(engine.getState());

engine.stop();

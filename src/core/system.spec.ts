import { System, SystemMode, AbstractEntitySystem, SystemListener } from './system';
import { Engine } from './engine';
import { Dispatcher } from './dispatcher';
import { AbstractEntity } from './entity';
import { Component } from './component';
import { Aspect } from './aspect';

class MySyncSystem extends System {
  public throw: string;

  process(): void {
    if (this.throw) throw new Error(this.throw);
  }
}

class MyAsyncSystem extends System {
  public throw: string;
  public timer = 10;

  async process(): Promise<void> {
    if (this.throw) throw new Error(this.throw);
    else return new Promise(resolve => setTimeout(resolve, this.timer));
  }
}

describe('System', () => {
  let system: MySyncSystem;
  let listener: SystemListener;

  beforeEach(() => {
    system = new MySyncSystem();
    listener = {
      onActivated: jest.fn(),
      onDeactivated: jest.fn(),
      onAddedToEngine: jest.fn(),
      onRemovedFromEngine: jest.fn(),
      onError: jest.fn(),
    };
    system.addListener(listener);
  });

  describe('initial', () => {
    it('should be a dispatcher', () => {
      expect(system instanceof Dispatcher).toBe(true);
    });

    it('should be active', () => {
      expect(system.active).toBe(true);
    });

    it('should not be updating', () => {
      expect(system.updating).toBe(false);
    });
  });

  describe('active', () => {
    it('should not notify any listener if the value did not change', () => {
      system.active = true;
      expect(listener.onActivated).not.toHaveBeenCalled();
      expect(listener.onDeactivated).not.toHaveBeenCalled();
    });

    it('should call onActivated on each listener if the value changes to "true"', () => {
      system.active = false;
      system.active = true;
      expect(listener.onActivated).toHaveBeenCalled();
      expect(listener.onDeactivated).toHaveBeenCalledTimes(1);
    });

    it('should call onDeactivated on each listener if the value changes to "false"', () => {
      system.active = false;
      expect(listener.onActivated).not.toHaveBeenCalled();
      expect(listener.onDeactivated).toHaveBeenCalled();
    });
  });

  describe('engine', () => {
    it('should not notify any listener if the value did not change', () => {
      const engine = system.engine;
      system.engine = engine;
      expect(listener.onAddedToEngine).not.toHaveBeenCalled();
      expect(listener.onRemovedFromEngine).not.toHaveBeenCalled();
    });

    it('should call onAddedToEngine on each listener if the value changes', () => {
      system.engine = new Engine();
      expect(listener.onAddedToEngine).toHaveBeenCalledWith(system.engine);
      expect(listener.onRemovedFromEngine).not.toHaveBeenCalled();
    });

    it('should not call onRemovedFromEngine on any listener if there was no engine before assigned"', () => {
      system.engine = new Engine();
      expect(listener.onRemovedFromEngine).not.toHaveBeenCalled();
    });

    it('should not call onAddedToEngine on any listener if there is no new engine assigned"', () => {
      const before = new Engine();
      system.engine = before;
      system.engine = null;
      expect(listener.onAddedToEngine).toHaveBeenLastCalledWith(before);
    });

    it.each([new Engine(), null])(
      'should call onRemovedFromEngine on each listener if the value changes to %p and an engine was assigned',
      newEngine => {
        const oldEngine = new Engine();
        system.engine = oldEngine;
        system.engine = newEngine;
        expect(listener.onRemovedFromEngine).toHaveBeenCalledWith(oldEngine);
      }
    );
  });

  describe('run (sync)', () => {
    it('should call the process method with the correct delta', () => {
      let called = false;
      const dlt = 5;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (system as any).process = function (delta) {
        called = delta;
      };
      system.run(5);
      expect(called).toBe(dlt);
    });

    it('should notify all listeners if an exception occurred', () => {
      system.throw = 'Error system.spec';
      let called: Error = null;
      system.addListener({ onError: error => (called = error) });
      try {
        system.run(0);
      } finally {
        expect(called).not.toBe(null);
        expect(called.message).toBe(system.throw);
      }
    });

    it('should convert the result of the system into a promise, if forced', () => {
      expect(system.run(5, SystemMode.ASYNC) instanceof Promise).toBe(true);
    });
  });

  describe('run (async)', () => {
    beforeEach(() => (system = new MyAsyncSystem()));

    it('should turn the system into the updating state', async () => {
      const re = system.run(0, SystemMode.ASYNC);
      expect(system.updating).toBe(true);
      await re;
    });

    it('should call the process method with the correct delta', async () => {
      let called = false;
      const dlt = 5;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>system).process = function (delta) {
        called = delta;
      };
      const re = system.run(5, SystemMode.ASYNC);
      await re;
      expect(called).toBe(dlt);
    });

    it('should return the system from the updating state', async () => {
      await system.run(0, SystemMode.ASYNC);
      expect(system.updating).toBe(false);
    });

    it('should return the system from the updating state if an exception occurred', async () => {
      system.throw = 'Error system.spec';
      try {
        await system.run(0, SystemMode.ASYNC);
      } finally {
        expect(system.updating).toBe(false);
      }
    });

    it('should notify all listeners if an exception occurred', async () => {
      system.throw = 'Error system.spec';
      let called: Error = null;
      system.addListener({ onError: error => (called = error) });
      try {
        await system.run(0, SystemMode.ASYNC);
      } finally {
        expect(called).not.toBe(null);
        expect(called.message).toBe(system.throw);
      }
    });
  });
});

class MyEntity extends AbstractEntity {}
class MyComponent1 implements Component {}
class MyComponent2 implements Component {}
class MyComponent3 implements Component {}
class MyComponent4 implements Component {}

class MyEntitySystem extends AbstractEntitySystem<MyEntity> {
  entities: MyEntity[] = [];

  processEntity(entity: MyEntity): void {
    this.entities.push(entity);
  }

  getAspect(): Aspect {
    return this.aspect;
  }

  setEngine(engine: Engine): void {
    this._engine = engine;
  }
}

describe('AbstractEntitySystem', () => {
  it('should process each entity in the engine', () => {
    const engine = new Engine();
    engine.entities.add(new MyEntity('1'), new MyEntity('2'), new MyEntity('3'));
    const system = new MyEntitySystem();
    engine.systems.add(system);
    engine.run();
    expect(system.entities.length).toBe(engine.entities.length);
    engine.entities.forEach((entity, i) => {
      expect(system.entities[i]).toBe(entity);
    });
  });

  it('should process each entity fitting the provided aspects', () => {
    const engine = new Engine();
    engine.entities.add(new MyEntity('1'), new MyEntity('2'), new MyEntity('3'));
    engine.entities.elements[0].components.add(new MyComponent1(), new MyComponent2(), new MyComponent4());
    engine.entities.elements[1].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3());
    engine.entities.elements[2].components.add(new MyComponent1(), new MyComponent2());

    const system = new MyEntitySystem(0, [MyComponent1], [MyComponent3], [MyComponent4, MyComponent2]);
    engine.systems.add(system);
    engine.run();
    expect(system.entities.length).toBe(2);
  });

  it('should not do anything if onRemovedFromEngine is being called without have been added to an engine', () => {
    const system = new MyEntitySystem(0);
    expect(() => system.onRemovedFromEngine()).not.toThrow();
  });

  it('should detach the aspect after removing the system from the engine', () => {
    const engine = new Engine();

    const system = new MyEntitySystem(0, [MyComponent1], [MyComponent3], [MyComponent4, MyComponent2]);
    engine.systems.add(system);
    expect(system.getAspect().isAttached).toBe(true);
    engine.systems.remove(system);
    expect(system.getAspect().isAttached).toBe(false);
  });

  it.each([
    { name: 'onAddedEntities', args: [new MyEntity('1'), new MyEntity('2'), new MyEntity('3')] },
    { name: 'onRemovedEntities', args: [new MyEntity('1'), new MyEntity('2'), new MyEntity('3')] },
    { name: 'onClearedEntities', args: [] },
    { name: 'onSortedEntities', args: [] },
    { name: 'onAddedComponents', args: [new MyEntity('1'), [new MyComponent1(), new MyComponent2()]] },
    { name: 'onRemovedComponents', args: [new MyEntity('2'), [new MyComponent1(), new MyComponent2()]] },
    { name: 'onClearedComponents', args: [new MyEntity('3')] },
    { name: 'onSortedComponents', args: [new MyEntity('4')] },
  ])('should call $name with $args when dispatching via the aspect', ({ name, args }) => {
    const system = new MyEntitySystem();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = jest.spyOn(system, name as any);
    system.engine = new Engine();
    const aspect = system.getAspect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aspect.dispatch(name as any, ...args);

    expect(spy).toHaveBeenCalledWith(...args);
  });

  it.each(['engine', 'engine-no-aspect', 'aspect'])(
    'should not process entities, if there are no %s entities',
    type => {
      const system = new MyEntitySystem(0);
      if (type === 'aspect') system.engine = new Engine();
      else if (type === 'engine-no-aspect') system.setEngine(new Engine());
      const spy = jest.spyOn(system, 'processEntity');

      system.process();

      expect(spy).not.toHaveBeenCalled();
    }
  );
});

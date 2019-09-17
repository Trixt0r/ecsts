import { System, SystemMode, AbstractEntitySystem } from './system';
import { Engine } from './engine';
import { Dispatcher } from './dispatcher';
import { AbstractEntity } from './entity';
import { Component } from './component';
import { Aspect } from './aspect';

class MySyncSystem extends System {

  public throw: string;

  process(delta: number): void {
    if (this.throw)
      throw new Error(this.throw);
  }
}

class MyAsyncSystem extends System {

  public throw: string;
  public timer: number = 10;

  async process(delta: number): Promise<any> {
    if (this.throw)
      throw new Error(this.throw);
    else
      return new Promise(resolve => setTimeout(resolve, this.timer));
  }
}

describe('System', () => {

  let system: MySyncSystem;

  beforeEach(() => system = new MySyncSystem());

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
      let called = false;
      system.addListener({
        onActivated: () => called = true,
        onDeactivated: () => called = true
      });
      system.active = system.active;
      expect(called).toBe(false);
    });

    it('should call onActivated on each listener if the value changes to "true"', () => {
      system.active = false;
      let calledActivated = false;
      let calledDectivated = false;
      system.addListener({
        onActivated: () => calledActivated = true,
        onDeactivated: () => calledDectivated = true
      });
      system.active = true;
      expect(calledDectivated).toBe(false);
      expect(calledActivated).toBe(true);
    });

    it('should call onDeactivated on each listener if the value changes to "false"', () => {
      let calledActivated = false;
      let calledDectivated = false;
      system.addListener({
        onActivated: () => calledActivated = true,
        onDeactivated: () => calledDectivated = true
      });
      system.active = false;
      expect(calledActivated).toBe(false);
      expect(calledDectivated).toBe(true);
    });
  });

  describe('engine', () => {
    it('should not notify any listener if the value did not change', () => {
      let called = false;
      system.addListener({
        onAddedToEngine: () => called = true,
        onRemovedFromEngine: () => called = true
      });
      system.engine = system.engine;
      expect(called).toBe(false);
    });

    it('should call onAddedToEngine on each listener if the value changes', () => {
      let calledAdded: Engine = null;
      let calledRemoved: Engine = null;
      system.addListener({
        onAddedToEngine: engine => calledAdded = engine,
        onRemovedFromEngine: engine => calledRemoved = engine
      });
      system.engine = new Engine();
      expect(calledRemoved).toBeNull();
      expect(calledAdded).toBe(system.engine);
    });

    it('should not call onRemovedFromEngine on any listener if there was not engine before assigned"', () => {
      let calledRemoved: Engine = null;
      system.addListener({
        onRemovedFromEngine: engine => calledRemoved = engine
      });
      system.engine = new Engine();
      expect(calledRemoved).toBeNull();
    });

    it('should not call onAddedToEngine on any listener if there is no new engine assigned"', () => {
      system.engine = new Engine();
      let calledAdded: Engine = null;
      system.addListener({
        onAddedToEngine: engine => calledAdded = engine,
      });
      system.engine = null;
      expect(calledAdded).toBeNull();
    });

    it('should call onRemovedFromEngine on each listener if the value changes and an engine was assigned', () => {
      const oldEngine = new Engine();
      system.engine = oldEngine;
      let calledRemoved: Engine = null;
      system.addListener({
        onRemovedFromEngine: engine => calledRemoved = engine
      });
      system.engine = new Engine();
      expect(calledRemoved).toBe(oldEngine);
    });

    it('should call onRemovedFromEngine on each listener if the value changes to null and an engine was assigned', () => {
      const oldEngine = new Engine();
      system.engine = oldEngine;
      let calledAdded: Engine = null;
      let calledRemoved: Engine = null;
      system.addListener({
        onAddedToEngine: engine => calledAdded = engine,
        onRemovedFromEngine: engine => calledRemoved = engine
      });
      system.engine = null;
      expect(calledAdded).toBeNull();
      expect(calledRemoved).toBe(oldEngine);
    });
  });

  describe('run (sync)', () => {

    it('should call the process method with the correct delta', () => {
      let called = false;
      const dlt = 5;
      (<any>system).process = function(delta) { called = delta };
      system.run(5);
      expect(called).toBe(dlt);
    });

    it('should notify all listeners if an exception occurred', () => {
      system.throw = 'Error system.spec';
      let called: Error = null;
      system.addListener({ onError: error => called = error });
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

    beforeEach(() => system = new MyAsyncSystem());

    it('should turn the system into the updating state', async () => {
      const re = system.run(0, SystemMode.ASYNC);
      expect(system.updating).toBe(true);
      await re;
    });

    it('should call the process method with the correct delta', async () => {
      let called = false;
      const dlt = 5;
      (<any>system).process = function(delta) { called = delta };
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
      system.addListener({ onError: error => called = error });
      try {
        await system.run(0, SystemMode.ASYNC);
      } finally {
        expect(called).not.toBe(null);
        expect(called.message).toBe(system.throw);
      }
    });
  });

});

class MyEntity extends AbstractEntity { }
class MyComponent1 implements Component { }
class MyComponent2 implements Component { }
class MyComponent3 implements Component { }
class MyComponent4 implements Component { }

class MyEntitySystem extends AbstractEntitySystem<MyEntity> {

  entities: MyEntity[] = [];

  processEntity(entity: MyEntity): void {
    this.entities.push(entity);
  }

  getAspect(): Aspect {
    return this.aspect;
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

  it('should detach the aspect after removing the system from the engine', () => {
    const engine = new Engine();

    const system = new MyEntitySystem(0, [MyComponent1], [MyComponent3], [MyComponent4, MyComponent2]);
    engine.systems.add(system);
    expect(system.getAspect().isAttached).toBe(true);
    engine.systems.remove(system);
    expect(system.getAspect().isAttached).toBe(false);
  });

});

import { System } from './system';
import { Engine } from './engine';
import { Dispatcher } from './dispatcher';

class MySystem extends System {

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

  let system: MySystem;

  beforeEach(() => system = new MySystem());

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

  describe('update', () => {
    it('should turn the system into the updating state', async () => {
      const re = system.update(0);
      expect(system.updating).toBe(true);
      await re;
    });

    it('should call the process method with the correct delta', async () => {
      let called = false;
      const dlt = 5;
      (<any>system).process = function(delta) { called = delta };
      const re = system.update(5);
      await re;
      expect(called).toBe(dlt);
    });

    it('should return the system from the updating state', async () => {
      await system.update(0);
      expect(system.updating).toBe(false);
    });

    it('should return the system from the updating state if an exception occurred', async () => {
      system.throw = 'Error';
      try {
        await system.update(0);
      } finally {
        expect(system.updating).toBe(false);
      }
    });

    it('should notify all listeners if an exception occurred', async () => {
      system.throw = 'Error';
      let called: Error = null;
      system.addListener({ onError: error => called = error });
      try {
        await system.update(0);
      } finally {
        expect(called).not.toBe(null);
        expect(called.message).toBe(system.throw);
      }
    });
  });

});

import { Engine, EngineMode } from './engine';
import { System } from './system';
import { Dispatcher } from './dispatcher';
import { Collection } from './collection';
import { AbstractEntity } from './entity';
import { Filter } from './filter';

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

  process(delta: number): Promise<void> {
    if (this.throw)
      throw new Error(this.throw);
    else
      return new Promise(resolve => setTimeout(resolve, this.timer));
  }
}

class MyEntity extends AbstractEntity { }

describe('Engine', () => {

  let engine: Engine;

  beforeEach(() => engine = new Engine());

  describe('initial', () => {
    it('should be a dispatcher', () => {
      expect(engine instanceof Dispatcher).toBe(true);
    });

    it('should have a collection of systems', () => {
      expect(engine.systems instanceof Collection).toBe(true);
    });

    it('should have no systems', () => {
      expect(engine.systems.length).toBe(0);
    });

    it('should have no active systems', () => {
      expect(engine.activeSystems.length).toBe(0);
    });

    it('should have default listener on the systems collection', () => {
      expect(engine.systems.listeners.length).toBe(1);
    });

    it('should throw if someone tries to remove the default systems listeners', () => {
      expect(() => engine.systems.removeListener(0)).toThrowError('Listener at index 0 is locked.');
    });

    it('should have a collection of entities', () => {
      expect(engine.entities instanceof Collection).toBe(true);
    });

    it('should have no entities', () => {
      expect(engine.entities.length).toBe(0);
    });

    it('should have default listener on the entities collection', () => {
      expect(engine.entities.listeners.length).toBe(1);
    });

    it('should throw if someone tries to remove the default entities listeners', () => {
      expect(() => engine.entities.removeListener(0)).toThrowError('Listener at index 0 is locked.');
    });
  });

  describe('systems', () => {
    it('should call onAddedSystems on each listener if a system got added', () => {
      let called: System = null;
      let calledRemoved: System = null;
      engine.addListener({ onAddedSystems: sys => called = sys, onRemovedSystems: sys => calledRemoved = sys });
      engine.systems.add(new MySyncSystem());
      expect(called).toBe(engine.systems.elements[0]);
      expect(calledRemoved).toBeNull();
    });

    it('should call onRemovedSystems on each listener if a system got removed', () => {
      let called: System = null;
      let calledAdded: System = null;
      const system = new MySyncSystem();
      engine.systems.add(system);
      engine.addListener({ onRemovedSystems: sys => called = sys, onAddedSystems: sys => calledAdded = sys });
      engine.systems.remove(system);
      expect(called).toBe(system);
      expect(calledAdded).toBeNull();
    });

    it('should call onClearedSystems on each listener if the systems got cleared', () => {
      let called = false;
      engine.systems.add(new MySyncSystem());
      engine.addListener({ onClearedSystems: () => called = true });
      engine.systems.clear();
      expect(called).toBe(true);
    });

    it('should be sorted by priority', () => {
      engine.systems.add(new MySyncSystem(3), new MySyncSystem(2), new MySyncSystem(1));
      expect(engine.systems.elements[0].priority).toBe(1);
      expect(engine.systems.elements[1].priority).toBe(2);
      expect(engine.systems.elements[2].priority).toBe(3);
    });
  });

  describe('entities', () => {
    it('should call onAddedEntities on each listener if an entity got added', () => {
      let called: AbstractEntity = null;
      let calledRemoved: AbstractEntity = null;
      engine.addListener({ onAddedEntities: sys => called = sys, onRemovedEntities: sys => calledRemoved = sys });
      engine.entities.add(new MyEntity('id'));
      expect(called).toBe(engine.entities.elements[0]);
      expect(calledRemoved).toBeNull();
    });

    it('should call onRemovedEntities on each listener if an entity got removed', () => {
      let called: AbstractEntity = null;
      let calledAdded: AbstractEntity = null;
      const system = new MyEntity('id');
      engine.entities.add(system);
      engine.addListener({ onRemovedEntities: sys => called = sys, onAddedEntities: sys => calledAdded = sys });
      engine.entities.remove(system);
      expect(called).toBe(system);
      expect(calledAdded).toBeNull();
    });

    it('should call onClearedEntities on each listener if the entities got cleared', () => {
      let called = false;
      engine.entities.add(new MyEntity('id'));
      engine.addListener({ onClearedEntities: () => called = true });
      engine.entities.clear();
      expect(called).toBe(true);
    });
  });

  describe('activeSystems', () => {
    it('should be frozen initially', () => {
      expect(() => (<any>engine.activeSystems).push(new MySyncSystem())).toThrow();
    });

    it('should be frozen after a system got added', () => {
      engine.systems.add(new MySyncSystem());
      expect(() => (<any>engine.activeSystems).push(new MySyncSystem())).toThrow();
    });

    it('should be frozen after a system got removed', () => {
      const comp = new MySyncSystem();
      engine.systems.add(comp);
      engine.systems.remove(comp);
      expect(() => (<any>engine.activeSystems).push(new MySyncSystem())).toThrow();
    });

    it('should be frozen after the systems got cleared', () => {
      const comp = new MySyncSystem();
      engine.systems.add(comp);
      engine.systems.clear();
      expect(() => (<any>engine.activeSystems).push(new MySyncSystem())).toThrow();
    });

    it('should be frozen after the systems got sorted', () => {
      const comp = new MySyncSystem();
      engine.systems.add(comp);
      engine.systems.sort();
      expect(() => (<any>engine.activeSystems).push(new MySyncSystem())).toThrow();
    });

    it('should update if a new active system got added', () => {
      engine.systems.add(new MySyncSystem());
      expect(engine.activeSystems.length).toBe(1);
    });

    it('should update if a new active system got removed', () => {
      engine.systems.add(new MySyncSystem());
      engine.systems.remove(0);
      expect(engine.activeSystems.length).toBe(0);
    });

    it('should not add an inactive system to the list', () => {
      const system = new MySyncSystem();
      system.active = false;
      engine.systems.add(system);
      expect(engine.activeSystems.length).toBe(0);
    });

    it('should update if a previously added active system got inactive', () => {
      const system = new MySyncSystem();
      engine.systems.add(system);
      system.active = false;
      expect(engine.activeSystems.length).toBe(0);
    });

    it('should update if a previously added inactive system got active', () => {
      const system = new MySyncSystem();
      system.active = false;
      engine.systems.add(system);
      system.active = true;
      expect(engine.activeSystems.length).toBe(1);
    });

    it('should be sorted by priority', () => {
      engine.systems.add(new MySyncSystem(3), new MySyncSystem(2), new MySyncSystem(1));
      expect(engine.activeSystems[0].priority).toBe(1);
      expect(engine.activeSystems[1].priority).toBe(2);
      expect(engine.activeSystems[2].priority).toBe(3);
    });
  });

  describe('run', () => {
    const max = 10;

    describe('DEFAULT', () => {

      beforeEach(() => {
        for (let i = 0; i < max; i++) {
          const system = new MySyncSystem(Math.ceil(Math.random() * max));
          engine.systems.add(system);
        }
      });

      it('should call run on each active system with the correct delta value', () => {
        let called = 0;
        const dlt = 10;
        engine.systems.elements.forEach(system => {
          (<any>system).run = function(delta) { called += delta; };
        });
        engine.run(dlt);
        expect(called).toBe(dlt * max);
      });

      it('should not call run on inatcive systems', () => {
        let called = 0;
        const dlt = 10;
        engine.systems.elements.forEach(system => {
          (<any>system).run = function(delta) { called += delta; };
        });
        const toDeactivate = 3;
        for (let i = 0; i < toDeactivate; i++)
          engine.systems.elements[engine.systems.elements.length - 1 - i].active = false;
        engine.run(dlt);
        expect(called).toBe(dlt * (max - toDeactivate));
      });

      it('should execute each system in the correct order', () => {
        const remaining = engine.systems.elements.slice();
        engine.systems.elements.forEach(system => {
          (<any>system).run = function() {
            expect(remaining.shift()).toBe(system);
            remaining.forEach(s => expect(s.priority).toBeGreaterThanOrEqual(system.priority));
          };
        });
        engine.run(0);
      });

      it('should call onErrorBySystem on each listener if an error occurred in a system', () => {
        let error: Error = null;
        let system: System = null;
        engine.addListener({
          onErrorBySystem: (err, sys) => {
            error = err;
            system = sys;
          }
        });
        (<any>engine.systems.elements[0]).throw = 'Error sync engine.spec';
        engine.run(0);
        expect(error).not.toBeNull();
        expect(error.message).toBe((<any>engine.systems.elements[0]).throw);
        expect(system).toBe(engine.systems.elements[0]);
      });
    });

    describe('async', () => {

      beforeEach(() => {
        for (let i = 0; i < max; i++) {
          const system = new MyAsyncSystem(Math.ceil(Math.random() * max));
          system.timer = Math.ceil(Math.random() * 20);
          engine.systems.add(system);
        }
      });

      describe('SUCCESSIVE', () => {
        it('should call run on each active system with the correct delta value', async () => {
          let called = 0;
          const dlt = 10;
          engine.systems.elements.forEach(system => {
            (<any>system).run = function(delta) { called += delta; };
          });
          await engine.run(dlt, EngineMode.SUCCESSIVE);
          expect(called).toBe(dlt * max);
        });

        it('should not call run on inatcive systems', async () => {
          let called = 0;
          const dlt = 10;
          engine.systems.elements.forEach(system => {
            (<any>system).run = function(delta) { called += delta; };
          });
          const toDeactivate = 3;
          for (let i = 0; i < toDeactivate; i++)
            engine.systems.elements[engine.systems.elements.length - 1 - i].active = false;
          await engine.run(dlt, EngineMode.SUCCESSIVE);
          expect(called).toBe(dlt * (max - toDeactivate));
        });

        it('should wait for a system before continuing with the next one', async () => {
          engine.systems.elements.forEach(system => {
            (<any>system).process = function() {
              const updating = engine.systems.filter(system => system.updating);
              expect(updating.length).toBe(1);
              expect(updating[0]).toBe(system);
            };
          });
          await engine.run(0, EngineMode.SUCCESSIVE);
        });

        it('should execute each system in the correct order', async () => {
          const remaining = engine.systems.elements.slice();
          engine.systems.elements.forEach(system => {
            (<any>system).run = function() {
              expect(remaining.shift()).toBe(system);
              remaining.forEach(s => expect(s.priority).toBeGreaterThanOrEqual(system.priority));
            };
          });
          await engine.run(0, EngineMode.SUCCESSIVE);
        });

        it('should call onErrorBySystem on each listener if an error occurred in a system', async () => {
          let error: Error = null;
          let system: System = null;
          engine.addListener({
            onErrorBySystem: (err, sys) => {
              error = err;
              system = sys;
            }
          });
          (<any>engine.systems.elements[0]).throw = 'Error successive engine.spec';
          await engine.run(0, EngineMode.SUCCESSIVE);
          expect(error).not.toBeNull();
          expect(error.message).toBe((<any>engine.systems.elements[0]).throw);
          expect(system).toBe(engine.systems.elements[0]);
        });
      });

      describe('PARALLEL', () => {
        it('should call run on each active system with the correct delta value', async () => {
          let called = 0;
          const dlt = 10;
          engine.systems.elements.forEach(system => {
            (<any>system).run = function(delta) { called += delta; };
          });
          await engine.run(dlt, EngineMode.PARALLEL);
          expect(called).toBe(dlt * max);
        });

        it('should not call run on inatcive systems', async () => {
          let called = 0;
          const dlt = 10;
          engine.systems.elements.forEach(system => {
            (<any>system).run = function(delta) { called += delta; };
          });
          const toDeactivate = 3;
          for (let i = 0; i < toDeactivate; i++)
            engine.systems.elements[engine.systems.elements.length - 1 - i].active = false;
          await engine.run(dlt, EngineMode.PARALLEL);
          expect(called).toBe(dlt * (max - toDeactivate));
        });

        it('should not wait for a system before continuing with the next one', async () => {
          const re = engine.run(0, EngineMode.PARALLEL);
          const running = engine.systems.map(system => system.updating);
          expect(running.filter(updating => updating).length).toBe(engine.systems.length);
          await re;
        });

        it('should execute each system in the correct order', async () => {
          const remaining = engine.systems.elements.slice();
          engine.systems.elements.forEach(system => {
            (<any>system).run = function() {
              expect(remaining.shift()).toBe(system);
              remaining.forEach(s => expect(s.priority).toBeGreaterThanOrEqual(system.priority));
            };
          });
          await engine.run(0, EngineMode.PARALLEL);
        });

        it('should call onErrorBySystem on each listener if an error occurred in a system', async () => {
          let error: Error = null;
          let system: System = null;
          engine.addListener({
            onErrorBySystem: (err, sys) => {
              error = err;
              system = sys;
            }
          });
          (<any>engine.systems.elements[0]).throw = 'Error parallel engine.spec';
          await engine.run(0, EngineMode.PARALLEL);
          expect(error).not.toBeNull();
          expect(error.message).toBe((<any>engine.systems.elements[0]).throw);
          expect(system).toBe(engine.systems.elements[0]);
        });
      });
    });

  });

  describe('getFilter', () => {
    it('should call Filter.get with the engine itself as the first argument', () => {
      const orig = Filter.get;
      let set = null;
      (<any>Filter).get = function(...args: any[]) {
        set = args[0];
      };
      engine.getFilter();
      expect(set).toBe(engine);
      Filter.get = orig;
    });
  });
});

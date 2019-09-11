import { AbstractEntity } from './entity';
import { Dispatcher } from './dispatcher';
import { ComponentCollection } from './component';

class MyEntity extends AbstractEntity { }

describe('Entity', () => {
  let myEntity: AbstractEntity;
  beforeEach(() => myEntity = new MyEntity('randomId'));

  describe('initial', () => {
    it('should have an id', () => {
      expect(myEntity.id).toBe('randomId');
    });

    it('should be a dispatcher', () => {
      expect(myEntity instanceof Dispatcher).toBe(true);
    });

    it('should have a component collection', () => {
      expect(myEntity.components instanceof ComponentCollection).toBe(true);
    });

    it('should have no components', () => {
      expect(myEntity.components.length).toBe(0);
    });

    it('should have the entity as the first listener on the components collection', () => {
      expect(myEntity.components.listeners.length).toBe(2);
      expect(myEntity.components.listeners[1]).toBe(myEntity);
    });

    it('should throw if someone tries to remove the entity from the components listeners', () => {
      expect(() => myEntity.components.removeListener(myEntity)).toThrowError('Listener at index 1 is locked.');
    });
  });

  describe('dispatch', () => {

    it('should dispatch onAddedComponents if a component got added', () => {
      let called = false;
      myEntity.addListener({ onAddedComponents: () => called = true });
      myEntity.components.add({ });
      expect(called).toBe(true);
    });

    it('should dispatch onRemovedComponents if a component got removed', () => {
      let called = false;
      myEntity.addListener({ onRemovedComponents: () => called = true });
      myEntity.components.add({ });
      myEntity.components.remove(0);
      expect(called).toBe(true);
    });

    it('should dispatch onClearedComponents if the components got cleared', () => {
      let called = false;
      myEntity.addListener({ onClearedComponents: () => called = true });
      myEntity.components.add({ });
      myEntity.components.clear();
      expect(called).toBe(true);
    });

    it('should dispatch onSortedComponents if the components got sorted', () => {
      let called = false;
      myEntity.addListener({ onSortedComponents: () => called = true });
      myEntity.components.add({ });
      myEntity.components.sort();
      expect(called).toBe(true);
    });

  });

});

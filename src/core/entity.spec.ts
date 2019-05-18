import { Entity } from './entity';
import { Collection } from './collection';

class MyEntity extends Entity { }

describe('Entity', () => {
  let myEntity: Entity;
  beforeEach(() => myEntity = new MyEntity('randomId'));

  describe('initial', () => {
    it('should have an id', () => {
      expect(myEntity.id).toBe('randomId');
    });

    it('should have a collection of components', () => {
      expect(myEntity.components instanceof Collection).toBe(true);
    });

    it('should have no components', () => {
      expect(myEntity.components.length).toBe(0);
    });

    it('should have the entity as the first listener on the components collection', () => {
      expect(myEntity.components.listeners.length).toBe(1);
      expect(myEntity.components.listeners[0]).toBe(myEntity);
    });

    it('should throw if someone tries to remove the entity from the components listeners', () => {
      expect(() => myEntity.components.removeListener(myEntity)).toThrowError('Listener at index 0 is locked.');
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

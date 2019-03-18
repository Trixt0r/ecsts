import { Component } from './component';
import { Entity, EntityListener } from './entity';

class MyEntity extends Entity { }
class MyComponent extends Component { }

describe('Entity', () => {
  let myEntity: Entity;
  beforeEach(() => myEntity = new MyEntity('randomId'));

  describe('initial', () => {

    it('should have an id', () => {
      expect(myEntity.id).toBe('randomId');
    });

    it('should have no components', () => {
      expect(myEntity.components.length).toBe(0);
    });
  });

  describe('components', () => {
    it('should be sealed initially', () => {
      expect(() => myEntity.components.push(new MyComponent())).toThrow();
    });

    it('should be sealed after a component got added', () => {
      myEntity.addComponent(new MyComponent());
      expect(() => myEntity.components.push(new MyComponent())).toThrow();
    });

    it('should be sealed after a component got removed', () => {
      const comp = new MyComponent();
      myEntity.addComponent(comp);
      myEntity.removeComponent(comp);
      expect(() => myEntity.components.push(new MyComponent())).toThrow();
    });
  });

  describe('addComponent', () => {
    let comp: Component;

    beforeEach(() => comp = new MyComponent());

    it('should add a component', () => {
      const re = myEntity.addComponent(comp);
      expect(re).toBe(true);
      expect(myEntity.components.length).toBe(1);
      expect(myEntity.components).toContain(comp);
    });

    it('should not add the same component twice', () => {
      myEntity.addComponent(comp);
      expect(myEntity.components.length).toBe(1);
      expect(myEntity.components).toContain(comp);

      const re = myEntity.addComponent(comp);
      expect(re).toBe(false);
      expect(myEntity.components.length).toBe(1);
    });

    it('should notify all listeners that a component got added', () => {
      let added: Component = null;
      const listener: EntityListener = {
        onAddedComponent: (component: Component) => added = component
      };

      myEntity.addListener(listener);
      myEntity.addComponent(comp);
      expect(added).toBe(comp);
    });

    it('should not notify any listener that a component has been removed', () => {
      let removed: Component = null;
      const listener: EntityListener = {
        onRemovedComponent: (component: Component) => removed = component
      };

      myEntity.addListener(listener);
      myEntity.addComponent(comp);
      expect(removed).toBe(null);
    });
  });

  describe('removeComponent', () => {
    let comp: Component;

    beforeEach(() => {
      comp = new MyComponent();
      myEntity.addComponent(comp);
    });

    it('should remove a previously added component', () => {
      const re = myEntity.removeComponent(comp);
      expect(re).toBe(true);
      expect(myEntity.components.length).toBe(0);
      expect(myEntity.components).not.toContain(comp);
    });

    it('should remove a component at the specified index (0)', () => {
      const re = myEntity.removeComponent(0);
      expect(re).toBe(true);
      expect(myEntity.components.length).toBe(0);
      expect(myEntity.components).not.toContain(comp);
    });

    it('should not remove a component which is not part of the entity', () => {
      myEntity.removeComponent(comp);
      expect(myEntity.components.length).toBe(0);
      expect(myEntity.components).not.toContain(comp);

      const re = myEntity.removeComponent(comp);
      expect(re).toBe(false);
      expect(myEntity.components.length).toBe(0);
    });

    it('should not remove a component at an out of bounds index', () => {
      const re = myEntity.removeComponent(myEntity.components.length);
      expect(re).toBe(false);
    });

    it('should notify all listeners that a component got removed', () => {
      let removed: Component = null;
      const listener: EntityListener = {
        onRemovedComponent: (component: Component) => removed = component
      };

      myEntity.addListener(listener);
      myEntity.removeComponent(comp);
      expect(removed).toBe(comp);
    });

    it('should not notify any listener that a component has been added', () => {
      let added: Component = null;
      const listener: EntityListener = {
        onAddedComponent: (component: Component) => added = component
      };

      myEntity.addListener(listener);
      myEntity.removeComponent(comp);
      expect(added).toBe(null);
    });
  });

  describe('addListener', () => {
    const listener: EntityListener = { };

    it('should add the event listener, if not yet added', () => {
      const re = myEntity.addListener(listener);
      expect(re).toBe(true);
    });

    it('should not add the same event listener twice', () => {
      myEntity.addListener(listener);
      const re = myEntity.addListener(listener);
      expect(re).toBe(false);
    });
  });

  describe('removeListener', () => {
    const listener: EntityListener = { };

    beforeEach(() => myEntity.addListener(listener));

    it('should remove the previously added event listener', () => {
      const re = myEntity.removeListener(listener);
      expect(re).toBe(true);
    });

    it('should remove the listener at an index in bounds', () => {
      const re = myEntity.removeListener(0);
      expect(re).toBe(true);
    });

    it('should not remove a listener which was not added', () => {
      const re = myEntity.removeListener({ });
      expect(re).toBe(false);
    });

    it('should not remove anything if the index is out of bounds', () => {
      const re = myEntity.removeListener(1);
      expect(re).toBe(false);
    });

    it('should not remove previoulsy removed listener', () => {
      myEntity.removeListener(listener);
      const re = myEntity.removeListener(listener);
      expect(re).toBe(false);
    });
  });

});

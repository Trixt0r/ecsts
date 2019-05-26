import { Filter } from "./filter";
import { Collection } from "./collection";
import { Entity } from "./entity";
import { Component } from "./component";

class MyEntity extends Entity { }
class MySortableEntity extends Entity { constructor(id: string, public position: number) { super(id); } }
class MyComponent1 implements Component { }
class MyComponent2 implements Component { }
class MyComponent3 implements Component { }
class MyComponent4 implements Component { }
class MyTypedComponent1 implements Component { static readonly type = 'my-comp'; }
class MyTypedComponent2 implements Component { static readonly type = 'my-comp'; }
class MyTypedComponent3 implements Component { static readonly type = 'my-other-comp'; }
class MyTypedComponent4 implements Component { static readonly type = 'my-other-comp'; }

describe('Filter', () => {

  let filter: Filter;
  let collection: Collection<Entity>;

  beforeEach(() => {
    collection = new Collection();
    filter = Filter.get(collection, MyComponent1, MyComponent2, MyComponent3, MyTypedComponent1);
  });

  describe('initial', () => {
    it('should be attached', () => {
      expect(filter.isAttached).toBe(true);
      expect(collection.listeners.length).toBe(1);
    });

    it('should not match any entities, if collection is empty', () => {
      expect(filter.entities.length).toBe(0);
    });
  });

  describe('sync', () => {
    let entity: MyEntity;

    beforeEach(() => entity = new MyEntity('id'));

    describe('entities', () => {
      describe('add', () => {
        it('should not match any entities, if the entities have no components', () => {
          expect(filter.entities.length).toBe(0);
        });

        it('should not match entities, if the entities have no matching component(class)', () => {
          entity.components.add(new MyComponent4());
          collection.add(entity);
          expect(filter.entities.length).toBe(0);
        });

        it('should not match entities, if the entities have no matching component(type)', () => {
          entity.components.add(new MyTypedComponent3());
          entity.components.add(new MyTypedComponent4());
          collection.add(entity);
          expect(filter.entities.length).toBe(0);
        });

        it('should match entities, if the entities have at least one matching component(class)', () => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have at least one matching component(type)', () => {
          entity.components.add(new MyTypedComponent2());
          collection.add(entity);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have matching components multiple times(class)', () => {
          entity.components.add(new MyComponent1());
          entity.components.add(new MyComponent1());
          entity.components.add(new MyComponent1());
          collection.add(entity);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have matching components multiple times(type)', () => {
          entity.components.add(new MyTypedComponent2());
          entity.components.add(new MyTypedComponent1());
          entity.components.add(new MyTypedComponent1());
          collection.add(entity);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });
      });

      describe('remove', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
        });

        it('should not match the removed entities', () => {
          collection.remove(entity);
          expect(filter.entities.length).toBe(0);
        });

        it('should not remove entities if the removed did not match', () => {
          const other1 = new MyEntity('other1');
          const other2 = new MyEntity('other2');
          other2.components.add(new MyComponent4());
          collection.add(other1, other2);
          collection.remove(other1, other2);
          expect(filter.entities.length).toBe(1);
        });
      });

      describe('clear', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
        });

        it('should not match any entities', () => {
          collection.clear();
          expect(filter.entities.length).toBe(0);
        });
      });

      describe('sort', () => {
        it('should preserve the order', () => {
          collection.add(
            new MySortableEntity('1', 3),
            new MySortableEntity('2', 2),
            new MySortableEntity('3', 1),
          );
          collection.forEach(entity => entity.components.add(new MyComponent1()));
          collection.sort((a: any, b: any) => a.position - b.position);
          expect((<MySortableEntity>filter.entities[0]).position).toBe(1);
          expect((<MySortableEntity>filter.entities[1]).position).toBe(2);
          expect((<MySortableEntity>filter.entities[2]).position).toBe(3);
        });
      });
    });

    describe('components', () => {
      beforeEach(() => collection.add(entity));

      describe('add', () => {
        it('should match if a matching component got added', () => {
          entity.components.add(new MyComponent2());
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should not match if non-matching component got added', () => {
          entity.components.add(new MyComponent4());
          expect(filter.entities.length).toBe(0);
        });
      });

      describe('remove', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1());
          entity.components.add(new MyComponent2());
          entity.components.add(new MyComponent3());
          entity.components.add(new MyComponent4());
        });

        it('should still match if a non-matching component got removed', () => {
          entity.components.remove(3);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should still match if matching components got removed but there are still matching components', () => {
          entity.components.remove(0, 1);
          expect(filter.entities.length).toBe(1);
          expect(filter.entities[0]).toBe(entity);
        });

        it('should not match anymore if all matching component got removed', () => {
          entity.components.remove(0, 1, 2);
          expect(filter.entities.length).toBe(0);
        });
      });

      describe('clear', () => {
        it('should not match anymore if all components got removed', () => {
          entity.components.clear();
          expect(filter.entities.length).toBe(0);
        });
      });
    });
  });

  describe('attach/deatch', () => {
    it('should attach/detach the filter to the source collection if not attached/detached', () => {
      filter.detach();
      expect(filter.isAttached).toBe(false);
      expect(collection.listeners).not.toContain((<any>filter).listener);
      filter.attach();
      expect(collection.listeners).toContain((<any>filter).listener);
      expect(filter.isAttached).toBe(true);
    });
  });

  describe('static get', () => {
    it('should return a cached filter if the same collection and component types are requested (same order)', () => {
      const filter2 = Filter.get(collection, MyComponent1, MyComponent2, MyComponent3, MyTypedComponent1);
      expect(filter2).toBe(filter);
    });

    it('should return a cached filter if the same collection and component types are requested (different order)', () => {
      const filter2 = Filter.get(collection, MyComponent2, MyComponent3, MyComponent1, MyTypedComponent2);
      const filter3 = Filter.get(collection, MyComponent2, MyComponent1, MyComponent3, MyTypedComponent2);
      const filter4 = Filter.get(collection, MyComponent3, MyComponent2, MyComponent1, MyTypedComponent2);
      expect(filter2).toBe(filter);
      expect(filter3).toBe(filter);
      expect(filter4).toBe(filter);
    });

    it('should return a cached filter if the same collection and component types are duplicated', () => {
      const filter2 = Filter.get(collection, MyComponent2, MyComponent3, MyComponent1, MyTypedComponent1);
      const filter3 = Filter.get(collection, MyComponent2, MyComponent1, MyComponent3, MyTypedComponent1);
      const filter4 = Filter.get(collection, MyComponent3, MyComponent2, MyComponent1, MyTypedComponent1);
      const dup = Filter.get(collection, MyComponent2, MyComponent3, MyComponent1, MyComponent3, MyComponent2, MyComponent1, MyTypedComponent1);
      expect(filter2).toBe(filter);
      expect(filter3).toBe(filter);
      expect(filter4).toBe(filter);
      expect(dup).toBe(filter);
    });

    it('should not return a cached filter if the same collection and different components are requested', () => {
      const filter2 = Filter.get(collection, MyComponent2, MyComponent3);
      const filter3 = Filter.get(collection, MyComponent2, MyComponent1, MyTypedComponent1);
      const filter4 = Filter.get(collection, MyComponent4, MyTypedComponent3);
      expect(filter2).not.toBe(filter);
      expect(filter3).not.toBe(filter);
      expect(filter3).not.toBe(filter2);
      expect(filter4).not.toBe(filter2);
      expect(filter4).not.toBe(filter3);
    });

    it('should not return a cached filter if another collection but same component types are requested', () => {
      const filter2 = Filter.get(new Collection(), MyComponent1, MyComponent2, MyComponent3);
      expect(filter2).not.toBe(filter);
    });
  });

  afterEach(() => (<any>Filter).cache = []);

});

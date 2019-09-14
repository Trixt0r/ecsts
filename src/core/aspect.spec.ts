import { Aspect } from './aspect';
import { Collection } from './collection';
import { AbstractEntity } from './entity';
import { Component } from './component';

class MyEntity extends AbstractEntity { }
class MySortableEntity extends AbstractEntity { constructor(id: string, public position: number) { super(id); } }
class MyComponent1 implements Component { }
class MyComponent2 implements Component { }
class MyComponent3 implements Component { }
class MyComponent4 implements Component { }
class MyComponent5 implements Component { }
class MyComponent6 implements Component { }
class MyComponent7 implements Component { }
class MyComponent8 implements Component { }
class MyTypedComponent1 implements Component { static readonly type = 'my-comp'; }
class MyTypedComponent2 implements Component { static readonly type = 'my-comp'; }
class MyTypedComponent3 implements Component { static readonly type = 'my-other-comp'; }
class MyTypedComponent4 implements Component { static readonly type = 'my-other-comp'; }

describe('Aspect', () => {

  let aspectOne: Aspect;
  let collection: Collection<AbstractEntity>;

  beforeEach(() => {
    collection = new Collection();
    aspectOne = Aspect.for(collection).one(MyComponent1, MyComponent2, MyComponent3, MyTypedComponent1);
  });

  describe('initial', () => {
    it('should be attached', () => {
      expect(aspectOne.isAttached).toBe(true);
      expect(collection.listeners.length).toBe(1);
    });

    it('should not match any entities, if collection is empty', () => {
      expect(aspectOne.entities.length).toBe(0);
    });
  });

  describe('sync', () => {
    let entity: MyEntity;

    beforeEach(() => entity = new MyEntity('id'));

    describe('entities', () => {
      describe('add', () => {
        it('should not match any entities, if the entities have no components', () => {
          expect(aspectOne.entities.length).toBe(0);
        });

        it('should not match entities, if the entities have no matching component(class)', () => {
          entity.components.add(new MyComponent4());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(0);
        });

        it('should not match entities, if the entities have no matching component(type)', () => {
          entity.components.add(new MyTypedComponent3(), new MyTypedComponent4());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(0);
        });

        it('should match entities, if the entities have at least one matching component(class)', () => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have at least one matching component(type)', () => {
          entity.components.add(new MyTypedComponent2());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have matching components multiple times(class)', () => {
          entity.components.add(new MyComponent1());
          entity.components.add(new MyComponent1());
          entity.components.add(new MyComponent1());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should match entities, if the entities have matching components multiple times(type)', () => {
          entity.components.add(new MyTypedComponent2());
          entity.components.add(new MyTypedComponent1());
          entity.components.add(new MyTypedComponent1());
          collection.add(entity);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });
      });

      describe('remove', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
        });

        it('should not match the removed entities', () => {
          collection.remove(entity);
          expect(aspectOne.entities.length).toBe(0);
        });

        it('should not remove entities if the removed did not match', () => {
          const other1 = new MyEntity('other1');
          const other2 = new MyEntity('other2');
          other2.components.add(new MyComponent4());
          collection.add(other1, other2);
          collection.remove(other1, other2);
          expect(aspectOne.entities.length).toBe(1);
        });
      });

      describe('clear', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1());
          collection.add(entity);
        });

        it('should not match any entities', () => {
          collection.clear();
          expect(aspectOne.entities.length).toBe(0);
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
          expect((<MySortableEntity>aspectOne.entities[0]).position).toBe(1);
          expect((<MySortableEntity>aspectOne.entities[1]).position).toBe(2);
          expect((<MySortableEntity>aspectOne.entities[2]).position).toBe(3);
        });
      });
    });

    describe('components', () => {
      beforeEach(() => collection.add(entity));

      describe('add', () => {
        it('should match if a matching component got added', () => {
          entity.components.add(new MyComponent2());
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should not match if non-matching component got added', () => {
          entity.components.add(new MyComponent4());
          expect(aspectOne.entities.length).toBe(0);
        });
      });

      describe('remove', () => {
        beforeEach(() => {
          entity.components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent4());
        });

        it('should still match if a non-matching component got removed', () => {
          entity.components.remove(3);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should still match if matching components got removed but there are still matching components', () => {
          entity.components.remove(0, 1);
          expect(aspectOne.entities.length).toBe(1);
          expect(aspectOne.entities[0]).toBe(entity);
        });

        it('should not match anymore if all matching component got removed', () => {
          entity.components.remove(0, 1, 2);
          expect(aspectOne.entities.length).toBe(0);
        });
      });

      describe('clear', () => {
        it('should not match anymore if all components got removed', () => {
          entity.components.clear();
          expect(aspectOne.entities.length).toBe(0);
        });
      });
    });
  });


  describe('matches', () => {
    it('should match entities with an "all components" matcher', () => {
      const aspect = Aspect.for(collection, [MyComponent1, MyComponent2]);
      const matchingEntity = new MyEntity('my');
      const notMatchingEntity = new MyEntity('my2');
      matchingEntity.components.add(new MyComponent1(), new MyComponent2());
      notMatchingEntity.components.add(new MyComponent1());
      expect(aspect.matches(matchingEntity)).toBe(true);
      expect(aspect.matches(notMatchingEntity)).toBe(false);
    });

    it('should match entities with an "exclude components" matcher', () => {
      const aspect = Aspect.for(collection, void 0, [MyComponent1, MyComponent2]);
      const matchingEntity = new MyEntity('my');
      const notMatchingEntity = new MyEntity('my2');
      matchingEntity.components.add(new MyComponent3());
      notMatchingEntity.components.add(new MyComponent1());
      expect(aspect.matches(matchingEntity)).toBe(true);
      expect(aspect.matches(notMatchingEntity)).toBe(false);
    });

    it('should match entities with an "one components" matcher', () => {
      const aspect = Aspect.for(collection, void 0, void 0, [MyComponent1, MyComponent2]);
      const matchingEntity = new MyEntity('my');
      const notMatchingEntity = new MyEntity('my2');
      matchingEntity.components.add(new MyComponent1());
      notMatchingEntity.components.add(new MyComponent3());
      expect(aspect.matches(matchingEntity)).toBe(true);
      const matches = aspect.matches(notMatchingEntity);
      expect(matches).toBe(false);
    });

    it('should match entities with all 3 types of matchers', () => {
      const aspect = Aspect.for(collection, [MyComponent1, MyComponent2, MyComponent3], [MyComponent4, MyComponent5, MyComponent6], [MyComponent7, MyComponent8]);

      // Matching
      const matching = [new MyEntity('firstMatch'), new MyEntity('secondMatch')];
      matching[0].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent7());
      matching[1].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent8());
      matching.forEach(entity => expect(aspect.matches(entity)).toBe(true));

      // Not matching by all
      const notMatchingByAll = [ new MyEntity('all1'), new MyEntity('all2'), new MyEntity('all3') ];
      notMatchingByAll[0].components.add(new MyComponent1());
      notMatchingByAll[1].components.add(new MyComponent2());
      notMatchingByAll[2].components.add(new MyComponent3());
      notMatchingByAll.forEach(entity => expect(aspect.matches(entity)).toBe(false));

      // Not matching by exclude
      const notMatchingByExclude = [ new MyEntity('all1'), new MyEntity('all2'), new MyEntity('all3') ];
      notMatchingByExclude[0].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent7(), new MyComponent4());
      notMatchingByExclude[1].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent7(), new MyComponent5());
      notMatchingByExclude[2].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3(), new MyComponent7(), new MyComponent6());
      notMatchingByExclude.forEach(entity => expect(aspect.matches(entity)).toBe(false));

      // Not matching by one
      const notMatchingByOne = [ new MyEntity('all1'), new MyEntity('all2'), new MyEntity('all3') ];
      notMatchingByOne[0].components.add(new MyComponent1(), new MyComponent2(), new MyComponent3());
      notMatchingByExclude.forEach(entity => expect(aspect.matches(entity)).toBe(false));
    });
  });

  describe('attach/detach', () => {
    it('should attach/detach the filter to the source collection if not attached/detached', () => {
      aspectOne.detach();
      expect(aspectOne.isAttached).toBe(false);
      expect(collection.listeners).not.toContain((<any>aspectOne).listener);
      aspectOne.attach();
      expect(collection.listeners).toContain((<any>aspectOne).listener);
      expect(aspectOne.isAttached).toBe(true);
    });
  });

  describe('all/every', () => {

    it('should add an an "all components" matcher to the aspect', () => {
      const aspect = Aspect.for(collection);
      const re = aspect.all(MyComponent1, MyComponent2);
      const descriptor = aspect.getDescriptor();
      expect(re).toBe(aspect);
      expect(descriptor.all.length).toBe(2);
      expect(descriptor.all[0]).toBe(MyComponent1);
      expect(descriptor.all[1]).toBe(MyComponent2);
    });

    it('should not add the same type multiple times', () => {
      const aspect = Aspect.for(collection);
      aspect.all(MyComponent1, MyComponent1);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.all.length).toBe(1);
      expect(descriptor.all[0]).toBe(MyComponent1);
    });

    it('should update the filtered entities on its own', () => {
      const tmpColl = new Collection<AbstractEntity>();
      tmpColl.add(new MyEntity('1'), new MyEntity('2'), new MyEntity('3'));
      tmpColl.elements[0].components.add(new MyComponent1());
      tmpColl.elements[1].components.add(new MyComponent2());
      tmpColl.elements[2].components.add(new MyComponent2());
      const aspect = Aspect.for(tmpColl).all(MyComponent1);
      expect(aspect.entities.length).toBe(1);
      expect(aspect.entities[0]).toBe(tmpColl.elements[0]);
      aspect.all(MyComponent2);
      expect(aspect.entities.length).toBe(2);
      expect(aspect.entities[0]).toBe(tmpColl.elements[1]);
      expect(aspect.entities[1]).toBe(tmpColl.elements[2]);
    });

    it('should call "all" via "every"', () => {
      const aspect = Aspect.for(collection);
      let called = false;
      (<any>aspect).all = function() { called = true; };
      aspect.every(MyComponent1);
      expect(called).toBe(true);
    });

  });

  describe('exclude/without', () => {

    it('should add an an "exclude components" matcher to the aspect', () => {
      const aspect = Aspect.for(collection);
      const re = aspect.exclude(MyComponent1, MyComponent2);
      const descriptor = aspect.getDescriptor();
      expect(re).toBe(aspect);
      expect(descriptor.exclude.length).toBe(2);
      expect(descriptor.exclude[0]).toBe(MyComponent1);
      expect(descriptor.exclude[1]).toBe(MyComponent2);
    });

    it('should not add the same type multiple times', () => {
      const aspect = Aspect.for(collection);
      aspect.exclude(MyComponent1, MyComponent1);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.exclude.length).toBe(1);
      expect(descriptor.exclude[0]).toBe(MyComponent1);
    });

    it('should update the filtered entities on its own', () => {
      const tmpColl = new Collection<AbstractEntity>();
      tmpColl.add(new MyEntity('1'), new MyEntity('2'), new MyEntity('3'));
      tmpColl.elements[0].components.add(new MyComponent1());
      tmpColl.elements[1].components.add(new MyComponent2());
      tmpColl.elements[2].components.add(new MyComponent2());
      const aspect = Aspect.for(tmpColl).exclude(MyComponent1);
      expect(aspect.entities.length).toBe(2);
      expect(aspect.entities[0]).toBe(tmpColl.elements[1]);
      expect(aspect.entities[1]).toBe(tmpColl.elements[2]);
      aspect.exclude(MyComponent2);
      expect(aspect.entities.length).toBe(1);
      expect(aspect.entities[0]).toBe(tmpColl.elements[0]);
    });

    it('should call "exclude" via "without"', () => {
      const aspect = Aspect.for(collection);
      let called = false;
      (<any>aspect).exclude = function() { called = true; };
      aspect.without(MyComponent1);
      expect(called).toBe(true);
    });
  });

  describe('one/some', () => {

    it('should add an an "one components" matcher to the aspect', () => {
      const aspect = Aspect.for(collection);
      const re = aspect.one(MyComponent1, MyComponent2);
      const descriptor = aspect.getDescriptor();
      expect(re).toBe(aspect);
      expect(descriptor.one.length).toBe(2);
      expect(descriptor.one[0]).toBe(MyComponent1);
      expect(descriptor.one[1]).toBe(MyComponent2);
    });

    it('should not add the same type multiple times', () => {
      const aspect = Aspect.for(collection);
      aspect.one(MyComponent1, MyComponent1);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.one.length).toBe(1);
      expect(descriptor.one[0]).toBe(MyComponent1);
    });

    it('should update the filtered entities on its own', () => {
      const tmpColl = new Collection<AbstractEntity>();
      tmpColl.add(new MyEntity('1'), new MyEntity('2'), new MyEntity('3'), new MyEntity('4'));
      tmpColl.elements[0].components.add(new MyComponent1());
      tmpColl.elements[1].components.add(new MyComponent2());
      tmpColl.elements[2].components.add(new MyComponent3());
      tmpColl.elements[3].components.add(new MyComponent3());
      const aspect = Aspect.for(tmpColl).one(MyComponent1, MyComponent2);
      expect(aspect.entities.length).toBe(2);
      expect(aspect.entities[0]).toBe(tmpColl.elements[0]);
      expect(aspect.entities[1]).toBe(tmpColl.elements[1]);
      aspect.one(MyComponent1, MyComponent3);
      expect(aspect.entities.length).toBe(3);
      expect(aspect.entities[0]).toBe(tmpColl.elements[0]);
      expect(aspect.entities[1]).toBe(tmpColl.elements[2]);
      expect(aspect.entities[2]).toBe(tmpColl.elements[3]);
    });

    it('should call "one" via "some"', () => {
      const aspect = Aspect.for(collection);
      let called = false;
      (<any>aspect).one = function() { called = true; };
      aspect.some(MyComponent1);
      expect(called).toBe(true);
    });

  });

  describe('static for', () => {
    it('should return an aspect instance', () => {
      const aspect = Aspect.for(collection);
      expect(aspect instanceof Aspect).toBe(true);
    });

    it('should return an aspect instance with an "all components" matcher', () => {
      const aspect = Aspect.for(collection, [MyComponent1, MyComponent2]);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.all.length).toBe(2);
      expect(descriptor.exclude.length).toBe(0);
      expect(descriptor.one.length).toBe(0);
      expect(descriptor.all[0]).toBe(MyComponent1);
      expect(descriptor.all[1]).toBe(MyComponent2);
    });

    it('should return an aspect instance with an "exclude components" matcher', () => {
      const aspect = Aspect.for(collection, void 0, [MyComponent1, MyComponent2]);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.exclude.length).toBe(2);
      expect(descriptor.all.length).toBe(0);
      expect(descriptor.one.length).toBe(0);
      expect(descriptor.exclude[0]).toBe(MyComponent1);
      expect(descriptor.exclude[1]).toBe(MyComponent2);
    });

    it('should return an aspect instance with an "one components" matcher', () => {
      const aspect = Aspect.for(collection, void 0, void 0, [MyComponent1, MyComponent2]);
      const descriptor = aspect.getDescriptor();
      expect(descriptor.one.length).toBe(2);
      expect(descriptor.all.length).toBe(0);
      expect(descriptor.exclude.length).toBe(0);
      expect(descriptor.one[0]).toBe(MyComponent1);
      expect(descriptor.one[1]).toBe(MyComponent2);
    });
  });

  afterEach(() => (<any>Aspect).cache = []);

});

import { Collection, CollectionListener } from './collection';
import { Dispatcher } from './dispatcher';

class MyType { }
class MySortableType extends MyType {
  constructor(public position: number) { super(); }
}

describe('Collection', () => {
  let collection: Collection<MyType>;
  beforeEach(() => collection = new Collection());

  describe('initial', () => {
    it('should be a dispatcher', () => {
      expect(collection instanceof Dispatcher).toBe(true);
    });

    it('should have no objects', () => {
      expect(collection.length).toBe(0);
    });
  });

  describe('objects', () => {
    it('should be frozen initially', () => {
      expect(() => (<any>collection.objects).push(new MyType())).toThrow();
    });

    it('should be frozen after an object got added', () => {
      collection.add(new MyType());
      expect(() => (<any>collection.objects).push(new MyType())).toThrow();
    });

    it('should be frozen after an object got removed', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.remove(comp);
      expect(() => (<any>collection.objects).push(new MyType())).toThrow();
    });

    it('should be frozen after the collection got cleared', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.clear();
      expect(() => (<any>collection.objects).push(new MyType())).toThrow();
    });

    it('should be frozen after the collection got sorted', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.sort();
      expect(() => (<any>collection.objects).push(new MyType())).toThrow();
    });
  });

  describe('add', () => {
    let object: MyType;

    beforeEach(() => object = new MyType());

    it('should add an object', () => {
      const re = collection.add(object);
      expect(re).toBe(true);
      expect(collection.length).toBe(1);
      expect(collection.objects).toContain(object);
      expect(collection.objects[0]).toBe(object);
    });

    it('should add multiple objects', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      const re = collection.add(object, o1, o2);
      expect(re).toBe(true);
      expect(collection.length).toBe(3);
      expect(collection.objects).toContain(object);
      expect(collection.objects).toContain(o1);
      expect(collection.objects).toContain(o2);
      expect(collection.objects[0]).toBe(object);
      expect(collection.objects[1]).toBe(o1);
      expect(collection.objects[2]).toBe(o2);
    });

    it('should not add the same object twice (2 calls)', () => {
      collection.add(object);
      expect(collection.length).toBe(1);
      expect(collection.objects).toContain(object);

      const re = collection.add(object);
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not add the same object multiple times (1 call)', () => {
      collection.add(object, object, object, object);
      expect(collection.length).toBe(1);
      expect(collection.objects).toContain(object);
    });

    it('should notify all listeners that an object got added', () => {
      let added: MyType = null;
      const listener: CollectionListener<MyType> = {
        onAdded: (object: MyType) => added = object
      };

      collection.addListener(listener);
      collection.add(object);
      expect(added).toBe(object);
    });

    it('should notify all listeners that objects got added', () => {
      let added: MyType[] = [];
      const listener: CollectionListener<MyType> = {
        onAdded: (...objects: MyType[]) => added = objects
      };

      collection.addListener(listener);
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(object, o1, o2);
      expect(added.length).toBe(3);
      const objs = [object, o1, o2];
      objs.forEach((obj, i) => expect(obj).toBe(added[i]));
    });

    it('should not notify any listener that an object has been removed', () => {
      let removed: MyType = null;
      const listener: CollectionListener<MyType> = {
        onRemoved: (object: MyType) => removed = object
      };

      collection.addListener(listener);
      collection.add(object);
      expect(removed).toBe(null);
    });
  });

  describe('remove', () => {
    let object: MyType;

    beforeEach(() => {
      object = new MyType();
      collection.add(object);
    });

    it('should remove a previously added object', () => {
      const re = collection.remove(object);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.objects).not.toContain(object);
    });

    it('should remove multiple previously added objects', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      const re = collection.remove(object, o1, o2);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.objects).not.toContain(object);
      expect(collection.objects).not.toContain(o1);
      expect(collection.objects).not.toContain(o2);
    });

    it('should remove an object at the specified index (0)', () => {
      const re = collection.remove(0);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.objects).not.toContain(object);
    });

    it('should remove objects at the specified indices (0, 1, 2)', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      const re = collection.remove(0, 1, 2);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.objects).not.toContain(object);
      expect(collection.objects).not.toContain(o1);
      expect(collection.objects).not.toContain(o2);
    });

    it('should not remove an object which is not part of the collection', () => {
      const re = collection.remove(new MyType());
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not remove objects which are not part of the collection', () => {
      const re = collection.remove(new MyType(), new MyType(), new MyType());
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not remove an object at an out of bounds index', () => {
      const re = collection.remove(collection.length);
      expect(re).toBe(false);
    });

    it('should not remove multiple objects at out of bounds indices', () => {
      const re = collection.remove(-1, collection.length, collection.length + 1);
      expect(re).toBe(false);
    });

    it('should notify all listeners that an object got removed', () => {
      let removed: MyType = null;
      const listener: CollectionListener<MyType> = {
        onRemoved: (object: MyType) => removed = object
      };

      collection.addListener(listener);
      collection.remove(object);
      expect(removed).toBe(object);
    });

    it('should notify all listeners that multiple objects got removed', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      let removed: MyType[] = [];
      const listener: CollectionListener<MyType> = {
        onRemoved: (...objects: MyType[]) => removed = objects
      };

      collection.addListener(listener);
      collection.remove(object, o1, o2);
      expect(removed.length).toBe(3);
      const objs = [object, o1, o2];
      objs.forEach((obj, i) => expect(obj).toBe(removed[i]));
    });

    it('should not notify any listener that a object has been added', () => {
      let added: MyType = null;
      const listener: CollectionListener<MyType> = {
        onAdded: (object: MyType) => added = object
      };

      collection.addListener(listener);
      collection.remove(object);
      expect(added).toBe(null);
    });
  });

  describe('clear', () => {

    beforeEach(() => collection.add(new MyType(), new MyType(), new MyType()));

    it('should remove all objects from the collection', () => {
      collection.clear();
      expect(collection.length).toBe(0);
    });

    it('should notify all listeners that the collection has been cleared', () => {
      let called = false;
      collection.addListener({ onCleared: () => called = true });
      collection.clear();
      expect(called).toBe(true);
    });
  });

  describe('sort', () => {

    beforeEach(() => collection.add(new MySortableType(3), new MySortableType(2), new MySortableType(1)));

    it('should sort the collection', () => {
      collection.sort((object: MySortableType) => object.position);

      const objects = <readonly MySortableType[]>collection.objects;
      expect(objects[0].position).toBe(1);
      expect(objects[1].position).toBe(2);
      expect(objects[2].position).toBe(3);
    });

    it('should notify all listeners that the collection has been sorted', () => {
      let called = false;
      collection.addListener({ onSorted: () => called = true });
      collection.sort();
      expect(called).toBe(true);
    });
  });

});

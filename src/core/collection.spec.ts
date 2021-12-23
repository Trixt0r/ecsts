import { Collection, CollectionListener } from './collection';
import { Dispatcher } from './dispatcher';

class MyType {}
class MySortableType extends MyType {
  constructor(public position: number) {
    super();
  }
}

describe('Collection', () => {
  let collection: Collection<MyType>;
  beforeEach(() => (collection = new Collection()));

  describe('initial', () => {
    it('should be a dispatcher', () => {
      expect(collection instanceof Dispatcher).toBe(true);
    });

    it('should have no elements', () => {
      expect(collection.length).toBe(0);
    });

    it('should accept an initial list of elements', () => {
      const source = [new MyType(), new MyType(), new MyType()];
      const c = new Collection(source);
      expect(c.length).toBe(source.length);
      c.forEach((el, i) => expect(el).toBe(source[i]));
    });
  });

  describe('elements', () => {
    it('should be frozen initially', () => {
      expect(() => (collection.elements as unknown[]).push(new MyType())).toThrow();
    });

    it('should be frozen after an element got added', () => {
      collection.add(new MyType());
      expect(() => (collection.elements as unknown[]).push(new MyType())).toThrow();
    });

    it('should be frozen after an element got removed', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.remove(comp);
      expect(() => (collection.elements as unknown[]).push(new MyType())).toThrow();
    });

    it('should be frozen after the collection got cleared', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.clear();
      expect(() => (collection.elements as unknown[]).push(new MyType())).toThrow();
    });

    it('should be frozen after the collection got sorted', () => {
      const comp = new MyType();
      collection.add(comp);
      collection.sort();
      expect(() => (collection.elements as unknown[]).push(new MyType())).toThrow();
    });
  });

  describe('add', () => {
    let element: MyType;

    beforeEach(() => (element = new MyType()));

    it('should add an element', () => {
      const re = collection.add(element);
      expect(re).toBe(true);
      expect(collection.length).toBe(1);
      expect(collection.elements).toContain(element);
      expect(collection.elements[0]).toBe(element);
    });

    it('should add multiple elements', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      const re = collection.add(element, o1, o2);
      expect(re).toBe(true);
      expect(collection.length).toBe(3);
      expect(collection.elements).toContain(element);
      expect(collection.elements).toContain(o1);
      expect(collection.elements).toContain(o2);
      expect(collection.elements[0]).toBe(element);
      expect(collection.elements[1]).toBe(o1);
      expect(collection.elements[2]).toBe(o2);
    });

    it('should not add the same element twice (2 calls)', () => {
      collection.add(element);
      expect(collection.length).toBe(1);
      expect(collection.elements).toContain(element);

      const re = collection.add(element);
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not add the same element multiple times (1 call)', () => {
      collection.add(element, element, element, element);
      expect(collection.length).toBe(1);
      expect(collection.elements).toContain(element);
    });

    it('should notify all listeners that an element got added', () => {
      let added: MyType = null;
      const listener: CollectionListener<MyType> = {
        onAdded: (element: MyType) => (added = element),
      };

      collection.addListener(listener);
      collection.add(element);
      expect(added).toBe(element);
    });

    it('should notify all listeners that elements got added', () => {
      let added: MyType[] = [];
      const listener: CollectionListener<MyType> = {
        onAdded: (...elements: MyType[]) => (added = elements),
      };

      collection.addListener(listener);
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(element, o1, o2);
      expect(added.length).toBe(3);
      const objs = [element, o1, o2];
      objs.forEach((obj, i) => expect(obj).toBe(added[i]));
    });

    it('should not notify any listener that an element has been removed', () => {
      let removed: MyType = null;
      const listener: CollectionListener<MyType> = {
        onRemoved: (element: MyType) => (removed = element),
      };

      collection.addListener(listener);
      collection.add(element);
      expect(removed).toBe(null);
    });
  });

  describe('remove', () => {
    let element: MyType;

    beforeEach(() => {
      element = new MyType();
      collection.add(element);
    });

    it('should remove a previously added element', () => {
      const re = collection.remove(element);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.elements).not.toContain(element);
    });

    it('should remove multiple previously added elements', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      const re = collection.remove(element, o1, o2);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.elements).not.toContain(element);
      expect(collection.elements).not.toContain(o1);
      expect(collection.elements).not.toContain(o2);
    });

    it('should remove an element at the specified index (0)', () => {
      const re = collection.remove(0);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.elements).not.toContain(element);
    });

    it('should remove elements at the specified indices (0, 1, 2)', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      const re = collection.remove(0, 1, 2);
      expect(re).toBe(true);
      expect(collection.length).toBe(0);
      expect(collection.elements).not.toContain(element);
      expect(collection.elements).not.toContain(o1);
      expect(collection.elements).not.toContain(o2);
    });

    it('should not remove an element which is not part of the collection', () => {
      const re = collection.remove(new MyType());
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not remove elements which are not part of the collection', () => {
      const re = collection.remove(new MyType(), new MyType(), new MyType());
      expect(re).toBe(false);
      expect(collection.length).toBe(1);
    });

    it('should not remove an element at an out of bounds index', () => {
      const re = collection.remove(collection.length);
      expect(re).toBe(false);
    });

    it('should not remove multiple elements at out of bounds indices', () => {
      const re = collection.remove(-1, collection.length, collection.length + 1);
      expect(re).toBe(false);
    });

    it('should notify all listeners that an element got removed', () => {
      let removed: MyType = null;
      const listener: CollectionListener<MyType> = {
        onRemoved: (element: MyType) => (removed = element),
      };

      collection.addListener(listener);
      collection.remove(element);
      expect(removed).toBe(element);
    });

    it('should notify all listeners that multiple elements got removed', () => {
      const o1 = new MyType();
      const o2 = new MyType();
      collection.add(o1, o2);
      let removed: MyType[] = [];
      const listener: CollectionListener<MyType> = {
        onRemoved: (...elements: MyType[]) => (removed = elements),
      };

      collection.addListener(listener);
      collection.remove(element, o1, o2);
      expect(removed.length).toBe(3);
      const objs = [element, o1, o2];
      objs.forEach((obj, i) => expect(obj).toBe(removed[i]));
    });

    it('should not notify any listener that a element has been added', () => {
      let added: MyType = null;
      const listener: CollectionListener<MyType> = {
        onAdded: (element: MyType) => (added = element),
      };

      collection.addListener(listener);
      collection.remove(element);
      expect(added).toBe(null);
    });
  });

  describe('clear', () => {
    let listener;
    beforeEach(() => {
      collection.add(new MyType(), new MyType(), new MyType());
      listener = { onCleared: jest.fn() };
      collection.addListener(listener);
    });

    it('should remove all elements from the collection', () => {
      collection.clear();
      expect(collection.length).toBe(0);
    });

    it('should notify all listeners that the collection has been cleared', () => {
      collection.add(new MyType());
      collection.clear();
      expect(listener.onCleared).toHaveBeenCalled();
    });

    it('should not notify any listener that the collection has been cleared if there were no elements', () => {
      collection.remove(0, 1, 2);
      collection.clear();
      expect(listener.onCleared).not.toHaveBeenCalled();
    });
  });

  describe('sort', () => {
    let listener;
    beforeEach(() => {
      collection.add(new MySortableType(3), new MySortableType(2), new MySortableType(1));
      listener = { onSorted: jest.fn() };
      collection.addListener(listener);
    });

    it('should sort the collection', () => {
      collection.sort((a, b) => (a as MySortableType).position - (b as MySortableType).position);

      const elements = <readonly MySortableType[]>collection.elements;
      expect(elements[0].position).toBe(1);
      expect(elements[1].position).toBe(2);
      expect(elements[2].position).toBe(3);
    });

    it('should notify all listeners that the collection has been sorted', () => {
      collection.add(new MySortableType(1));
      collection.sort();
      expect(listener.onSorted).toHaveBeenCalled();
    });

    it('should not notify any listener that the collection has been sorted if there were no elements', () => {
      collection.remove(0, 1, 2);
      collection.sort();
      expect(listener.onSorted).not.toHaveBeenCalled();
    });
  });

  describe('iterable', () => {
    const amount = 10;
    beforeEach(() => {
      for (let i = 0; i < amount; i++) collection.add(new MyType());
    });

    it('should be iterable', () => {
      expect(typeof collection[Symbol.iterator] === 'function').toBe(true);
    });

    it('should iterate over all elements in the collection', () => {
      let iterations = 0;
      for (const element of collection) {
        expect(element).toBe(collection.elements[iterations]);
        iterations++;
      }
      expect(iterations).toBe(collection.length);
    });

    it('should iterate over all elements in the collection multiple times', () => {
      let iterations = 0;
      const times = 5;
      for (let i = 0; i < 5; i++) {
        let iteration = 0;
        for (const element of collection) {
          expect(element).toBe(collection.elements[iteration++]);
          iterations++;
        }
      }
      expect(iterations).toBe(collection.length * times);
    });

    it('should iterate over all remaining elements in the collection', () => {
      let iterations = 0;
      collection.remove(amount - 1, amount - 2, amount - 3, amount - 4, amount - 5);
      for (const element of collection) {
        expect(element).toBe(collection.elements[iterations]);
        iterations++;
      }
      expect(iterations).toBe(collection.length);
    });
  });

  describe('array-like', () => {
    const amount = 10;
    beforeEach(() => {
      for (let i = 0; i < amount; i++) collection.add(new MyType());
    });

    it.each([
      { name: 'filter', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'forEach', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'find', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'findIndex', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'indexOf', args: [0] },
      { name: 'map', args: [(_: MyType, index: number) => index, {}] },
      { name: 'every', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'some', args: [(_: MyType, index: number) => index === 1, {}] },
      { name: 'reduce', args: [(prev, _elmnt, idx) => prev + idx, 0] },
      { name: 'reduceRight', args: [(prev, _elmnt, idx) => prev + idx, 0] },
    ])('should execute $name with $args', ({ name, args }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spy = jest.spyOn((collection as any)._elements, name);

      collection[name](...args);

      expect(spy).toHaveBeenCalledWith(...args);
    });
  });
});

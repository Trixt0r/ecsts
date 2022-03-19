import { ComponentCollection, Component } from './component';

class MyComponent1 implements Component {}

class MyComponentWithType implements Component {
  static type = 'myType';
}

describe('ComponentCollection', () => {
  let collection: ComponentCollection;

  beforeEach(() => (collection = new ComponentCollection()));

  describe('initial', () => {
    it('should throw if someone tries to remove the first component listener', () => {
      expect(() => collection.removeListener(0)).toThrowError('Listener at index 0 is locked.');
    });
  });

  describe('get', () => {
    it.each([MyComponent1, MyComponentWithType, 'myType'])('should not return any component for %p if empty', _ =>
      expect(collection.get(_)).toBeUndefined()
    );

    it.each([
      { query: MyComponent1, comp: new MyComponent1() },
      { query: MyComponentWithType, comp: new MyComponentWithType() },
      { query: MyComponentWithType, comp: { type: 'myType' } },
      { query: MyComponentWithType.type, comp: new MyComponentWithType() },
      { query: 'testType', comp: { type: 'testType' } },
    ])('should return $comp for $query', ({ query, comp }) => {
      collection.add(comp);
      expect(collection.get(query)).toBe(comp);
    });

    it.each([
      { query: MyComponent1, comp: new MyComponent1() },
      { query: MyComponentWithType, comp: new MyComponentWithType() },
      { query: MyComponentWithType, comp: { type: 'myType' } },
      { query: MyComponentWithType.type, comp: new MyComponentWithType() },
      { query: 'testType', comp: { type: 'testType' } },
    ])('should return $comp for previously added class, after the first access', ({ query, comp }) => {
      collection.get(query);
      collection.add(comp);
      expect(collection.get(query)).toBe(comp);
    });

    it.each([
      { count: 10, query: MyComponent1, type: 'class' },
      { count: 10, query: MyComponentWithType, type: 'type' },
    ])('should return the first component of the previously added $query', ({ count, query }) => {
      const comps = [];
      for (let i = 0; i < count; i++) {
        comps.push(new query());
        collection.add(comps[comps.length - 1]);
      }
      expect(collection.get(query)).toBe(comps[0]);
      expect(collection.get(query)).toBe(collection.elements[0]);
    });
  });

  describe('getAll', () => {
    it.each([MyComponent1, MyComponentWithType, 'myType'])('should not return any component for %p if empty', _ => {
      expect(collection.getAll(_)).toEqual([]);
    });

    it.each([
      { query: MyComponent1, comps: [new MyComponent1(), new MyComponent1(), new MyComponent1()] },
      { query: MyComponentWithType, comps: [new MyComponentWithType(), { type: 'myType' }] },
      { query: MyComponentWithType.type, comps: [new MyComponentWithType(), { type: 'myType' }] },
      { query: 'testType', comps: [{ type: 'testType' }, { type: 'testType' }, { type: 'testType' }] },
    ])('should return components for $query', ({ query, comps }) => {
      collection.add(...comps);
      expect(collection.getAll(query)).toEqual(comps);
    });

    it.each([
      { query: MyComponent1, comps: [new MyComponent1(), new MyComponent1(), new MyComponent1()] },
      { query: MyComponentWithType, comps: [new MyComponentWithType(), { type: 'myType' }] },
      { query: MyComponentWithType.type, comps: [new MyComponentWithType(), { type: 'myType' }] },
      { query: 'testType', comps: [{ type: 'testType' }, { type: 'testType' }, { type: 'testType' }] },
    ])('should return components for $query, after the first access', ({ query, comps }) => {
      collection.getAll(query);
      collection.add(...comps);
      expect(collection.getAll(query)).toEqual(comps);
    });

    it('should return same type components with different prototypes', () => {
      collection.getAll(MyComponentWithType);
      collection.getAll(MyComponentWithType.type);

      const comp1 = { type: MyComponentWithType.type };
      const comp2 = new MyComponentWithType();
      collection.add(comp1, comp2);

      expect(collection.getAll(MyComponentWithType.type)).toEqual([comp1, comp2]);
      expect(collection.getAll(MyComponentWithType)).toEqual([comp1, comp2]);
    });
  });
});

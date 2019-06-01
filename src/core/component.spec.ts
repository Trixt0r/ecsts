import { ComponentCollection, Component } from "./component";

class MyComponent1 implements Component {
}

class MyComponent2 implements Component {
}

class MyComponentWithType implements Component {
  static type = 'myType';
}

describe('ComponentCollection', () => {

  let collection: ComponentCollection;

  beforeEach(() => collection = new ComponentCollection());

  describe('initial', () => {
    it('should throw if someone tries to remove the first component listener', () => {
      expect(() => collection.removeListener(0)).toThrowError('Listener at index 0 is locked.');
    });
  });

  describe('get', () => {

    it('should not return any component if empty', () => {
      expect(collection.get(MyComponent1)).toBeUndefined();
      expect(collection.get(MyComponent2)).toBeUndefined();
      expect(collection.get(MyComponentWithType)).toBeUndefined();
      expect(collection.get('myType')).toBeUndefined();
    });

    it('should return a component of the previously added class', () => {
      const myComp = new MyComponent1();
      const myComp2 = new MyComponent2();
      collection.add(myComp);
      collection.add(myComp2);
      expect(collection.get(MyComponent1)).toBe(myComp);
      expect(collection.get(MyComponent2)).toBe(myComp2);
    });

    it('should return a component of the previously added type', () => {
      const myComp = new MyComponentWithType();
      collection.add(myComp);
      expect(collection.get(MyComponentWithType)).toBe(myComp);
      expect(collection.get('myType')).toBe(myComp);
    });

    it('should return a component of the previously added class, after the first access', () => {
      collection.get(MyComponent1);
      collection.get(MyComponent2);
      const myComp = new MyComponent1();
      const myComp2 = new MyComponent2();
      collection.add(myComp);
      collection.add(myComp2);
      expect(collection.get(MyComponent1)).toBe(myComp);
      expect(collection.get(MyComponent2)).toBe(myComp2);
    });

    it('should return a component of the previously added type, after the first access', () => {
      collection.get(MyComponentWithType);
      collection.get('myType');
      const myComp = new MyComponentWithType();
      collection.add(myComp);
      expect(collection.get(MyComponentWithType)).toBe(myComp);
      expect(collection.get('myType')).toBe(myComp);
    });

    it('should return the first component of the previously added class', () => {
      let comps = [];
      for (let i = 0; i < 10; i++) {
        comps.push(new MyComponent1());
        collection.add(comps[comps.length - 1]);
      }
      expect(collection.get(MyComponent1)).toBe(comps[0]);
      expect(collection.get(MyComponent1)).toBe(collection.elements[0]);

      collection.clear();
      comps = [];
      for (let i = 0; i < 10; i++) {
        comps.push(new MyComponentWithType());
        collection.add(comps[comps.length - 1]);
      }
      expect(collection.get(MyComponentWithType)).toBe(comps[0]);
      expect(collection.get(MyComponentWithType)).toBe(collection.elements[0]);
    });

  });

  describe('getAll', () => {

    it('should not return any component if empty', () => {
      expect(collection.getAll(MyComponent1).length).toBe(0);
      expect(collection.getAll(MyComponent2).length).toBe(0);
      expect(collection.getAll(MyComponentWithType).length).toBe(0);
      expect(collection.getAll('myType').length).toBe(0);
    });

    it('should return components of the previously added class', () => {
      for (let i = 0; i < 10; i++)
        collection.add(new MyComponent1(), new MyComponent2());
      const comp1 = collection.getAll(MyComponent1);
      const comp2 = collection.getAll(MyComponent2);
      expect(comp1.length).toBe(10);
      expect(comp2.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(collection.elements[i * 2]).toBe(comp1[i]);
        expect(collection.elements[i * 2 + 1]).toBe(comp2[i]);
      }
    });

    it('should return components of the previously added type', () => {
      for (let i = 0; i < 10; i++)
        collection.add(new MyComponentWithType());
      const byClass = collection.getAll(MyComponentWithType);
      const byString = collection.getAll('myType');
      expect(byClass.length).toBe(10);
      expect(byString.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(collection.elements[i]).toBe(byClass[i]);
        expect(collection.elements[i]).toBe(byString[i]);
      }
    });

    it('should return components of the previously added class, after the first access', () => {
      collection.getAll(MyComponent1);
      collection.getAll(MyComponent2);
      for (let i = 0; i < 10; i++)
        collection.add(new MyComponent1(), new MyComponent2());
      const comp1 = collection.getAll(MyComponent1);
      const comp2 = collection.getAll(MyComponent2);
      expect(comp1.length).toBe(10);
      expect(comp2.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(collection.elements[i * 2]).toBe(comp1[i]);
        expect(collection.elements[i * 2 + 1]).toBe(comp2[i]);
      }
    });

    it('should return components of the previously added type, after the first access', () => {
      collection.getAll(MyComponentWithType);
      collection.getAll('myType');
      for (let i = 0; i < 10; i++)
        collection.add(new MyComponentWithType());
      const byClass = collection.getAll(MyComponentWithType);
      const byString = collection.getAll('myType');
      expect(byClass.length).toBe(10);
      expect(byString.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(collection.elements[i]).toBe(byClass[i]);
        expect(collection.elements[i]).toBe(byString[i]);
      }
    });

  });

});

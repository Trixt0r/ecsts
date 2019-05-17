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
  });

});

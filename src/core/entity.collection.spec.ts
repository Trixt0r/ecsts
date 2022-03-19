import { AbstractEntity } from './entity';
import { EntityCollection } from './entity.collection';

class Entity extends AbstractEntity {}

describe('EntityCollection', () => {
  let collection: EntityCollection;

  beforeEach(() => (collection = new EntityCollection()));

  describe('get', () => {
    describe('onAdded', () => {
      beforeEach(() => {
        collection.add(new Entity(3), new Entity('1'), new Entity(null));
      });
      it('should return entities for previously added entities', () => {
        expect(collection.get(3)).toBeInstanceOf(Entity);
        expect(collection.get('1')).toBeInstanceOf(Entity);
        expect(collection.get(null)).toBeInstanceOf(Entity);

        expect(collection.get(3).id).toBe(3);
        expect(collection.get('1').id).toBe('1');
        expect(collection.get(null).id).toBe(null);
      });
      it('should not return entities which were not added', () => {
        expect(collection.get(1)).toBeUndefined();
        expect(collection.get('3')).toBeUndefined();
        expect(collection.get(undefined)).toBeUndefined();
      });
    });
    describe('onRemoved', () => {
      beforeEach(() => {
        collection.add(new Entity(3), new Entity('1'), new Entity(null));
        collection.remove(0, 2);
      });
      it('should not return entities for previously removed entities', () => {
        expect(collection.get(3)).toBeUndefined();
        expect(collection.get(null)).toBeUndefined();
      });
      it('should return entities which were not removed', () => {
        expect(collection.get('1')).toBeDefined();
      });
    });
    describe('onCleared', () => {
      beforeEach(() => {
        collection.add(new Entity(3), new Entity('1'), new Entity(null));
        collection.clear();
      });
      it('should not return any entities after clear', () => {
        expect(collection.get(3)).toBeUndefined();
        expect(collection.get('1')).toBeUndefined();
        expect(collection.get(null)).toBeUndefined();
      });
    });
  });
});

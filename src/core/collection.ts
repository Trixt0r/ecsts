import { Dispatcher } from "./dispatcher";

/**
 * The listener interface for a listener on an entity.
 *
 * @export
 * @interface CollectionListener
 */
export interface CollectionListener<T> {

  /**
   * Called as soon as a new object as been added to the collection.
   *
   * @param {T} object
   */
  onAdded?(object: T): void;

  /**
   * Called as soon as a object got removed from the collection.
   *
   * @param {T} object
   */
  onRemoved?(object: T): void;

  /**
   * Called as soon as all objects got removed from the collection.
   *
   * @param {T} object
   */
  onCleared?(): void;
}

/**
 * A collection holds a list of objects of a certain type
 * and allows to add, remove, sort and clear the list.
 * On each operation the internal list of objects gets sealed,
 * so a user of the collection will not be able to operate on the real reference,
 * but read the data without the need of copying the data on each read access.
 *
 * @export
 * @class Collection
 * @extends {Dispatcher<CollectionListener<T>>}
 * @template T
 */
export class Collection<T> extends Dispatcher<CollectionListener<T>> {

  /**
   * The internal list of objects.
   *
   * @protected
   * @type {T[]}
   */
  protected _objects: T[];

  /**
   * The sealed list of objects which is used to expose the object list to the public.
   *
   * @protected
   * @type {T[]}
   */
  protected _sealedObjects: T[];

  /**
   * Creates an instance of Collection.
   */
  constructor() {
    super();
    this._objects = [];
    this.updatedSealedObjects();
  }

  /**
   * A snapshot of all objects in this collection.
   *
   * @readonly
   * @type {T[]}
   */
  get objects(): T[] {
    return this._sealedObjects;
  }

  /**
   * The length, of this collection, i.e. how many objects this collection contains.
   *
   * @readonly
   * @type {number}
   */
  get length(): number {
    return this._sealedObjects.length;
  }

  /**
   * Updates the internal sealed object list.
   *
   * @protected
   */
  protected updatedSealedObjects(): void {
    this._sealedObjects = this._objects.slice();
    Object.seal(this._sealedObjects);
  }

  /**
   * Adds the given object to this collection.
   *
   * @param {T} object
   * @returns {boolean} Whether the object has been added or not.
   *                    It may not be added, if already present in the object list.
   */
  add(object: T): boolean {
    if (this._objects.indexOf(object) >= 0) return false;
    this._objects.push(object);
    this.updatedSealedObjects();
    this.dispatch('onAdded', object);
    return true;
  }

  /**
   * Removes the given object or the object at the given index.
   *
   * @param {(T | number)} objectOrIndex
   * @returns {boolean} Whether the object has been removed or not.
   *                    It may not have been removed, if it was not in the object list.
   */
  remove(objectOrIndex: T | number): boolean {
    const idx = typeof objectOrIndex === 'number' ? objectOrIndex : this._objects.indexOf(objectOrIndex);
    if (idx >= 0 && idx < this._objects.length) {
      const object = typeof objectOrIndex === 'number' ? this._objects[objectOrIndex] : objectOrIndex;
      this._objects.splice(idx);
      this.updatedSealedObjects();
      this.dispatch('onRemoved', object);
      return true;
    }
    return false;
  }

  /**
   * Clears this collection, i.e. removes all objects from the internal list.
   */
  clear(): void {
    this._objects = [];
    this.updatedSealedObjects();
    this.dispatch('onCleared');
  }

  /**
   * Sorts this collection.
   *
   * @param {(a: T, b: T) => number} [compareFn]
   * @returns {this}
   */
  sort(compareFn?: (a: T, b: T) => number): this {
    this._objects.sort(compareFn);
    this.updatedSealedObjects();
    return this;
  }

}

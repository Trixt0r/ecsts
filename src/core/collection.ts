import { Dispatcher } from "./dispatcher";

/**
 * The listener interface for a listener on an entity.
 *
 * @export
 * @interface CollectionListener
 */
export interface CollectionListener<T> {

  /**
   * Called as soon as new objects have been added to the collection.
   *
   * @param {T[]} objects
   */
  onAdded?(...objects: T[]): void;

  /**
   * Called as soon as new objects got removed from the collection.
   *
   * @param {T[]} objects
   */
  onRemoved?(...object: T[]): void;

  /**
   * Called as soon as all objects got removed from the collection.
   */
  onCleared?(): void;

  /**
   * Called as soon as the objects got sorted.
   */
  onSorted?(): void;
}

/**
 * A collection holds a list of objects of a certain type
 * and allows to add, remove, sort and clear the list.
 * On each operation the internal list of objects gets frozen,
 * so a user of the collection will not be able to operate on the real reference,
 * but read the data without the need of copying the data on each read access.
 *
 * @export
 * @class Collection
 * @extends {Dispatcher<CollectionListener<T>>}
 * @template T
 * @todo Make this iterable.
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
   * The frozen list of objects which is used to expose the object list to the public.
   *
   * @protected
   * @type {T[]}
   */
  protected _frozenObjects: T[];

  /**
   * Creates an instance of Collection.
   */
  constructor() {
    super();
    this._objects = [];
    this.updatedFrozenObjects();
  }

  /**
   * A snapshot of all objects in this collection.
   *
   * @readonly
   * @type {T[]}
   */
  get objects(): readonly T[] {
    return this._frozenObjects;
  }

  /**
   * The length, of this collection, i.e. how many objects this collection contains.
   *
   * @readonly
   * @type {number}
   */
  get length(): number {
    return this._frozenObjects.length;
  }

  /**
   * Updates the internal sealed object list.
   *
   * @protected
   */
  protected updatedFrozenObjects(): void {
    this._frozenObjects = this._objects.slice();
    Object.freeze(this._frozenObjects);
  }

  /**
   * Adds the given object to this collection.
   *
   * @param {T} object
   * @returns {boolean} Whether the object has been added or not.
   *                    It may not be added, if already present in the object list.
   */
  protected addSingle(object: T): boolean {
    if (this._objects.indexOf(object) >= 0) return false;
    this._objects.push(object);
    return true;
  }

  /**
   * Adds the given object(s) to this collection.
   *
   * @param {T[]} objects
   * @returns {boolean} Whether objects have been added or not.
   *                    They may not have been added, if they were already present in the object list.
   */
  add(...objects: T[]): boolean {
    const added: any[] = objects.filter(object => this.addSingle(object));
    const re = added.length > 0;
    if (re) {
      this.updatedFrozenObjects();
      added.unshift('onAdded');
      this.dispatch.apply(this, added);
    }
    return re;
  }

  /**
   * Removes the given object or the object at the given index.
   *
   * @param {(T | number)} objectOrIndex
   * @returns {boolean} Whether the object has been removed or not.
   *                    It may not have been removed, if it was not in the object list.
   */
  protected removeSingle(objectOrIndex: T | number): boolean {
    const idx = typeof objectOrIndex === 'number' ? objectOrIndex : this._objects.indexOf(objectOrIndex);
    if (idx >= 0 && idx < this._objects.length) {
      this._objects.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes the given object(s) or the objects at the given indices.
   *
   * @param {(T | number)[]} objectsOrIndices
   * @returns {boolean} Whether objects have been removed or not.
   *                    They may not have been removed, if every object was not in the object list.
   */
  remove(...objectsOrIndices: (T | number)[]): boolean {
    const objects = <T[]>objectsOrIndices.map(o => typeof o === 'number' ? this._objects[o] : o);
    const removed: any[] = objects.filter(object => this.removeSingle(object));
    const re = removed.length > 0;
    if (re) {
      this.updatedFrozenObjects();
      removed.unshift('onRemoved');
      this.dispatch.apply(this, removed);
    }
    return re;
  }

  /**
   * Clears this collection, i.e. removes all objects from the internal list.
   */
  clear(): void {
    if (!this._objects.length) return;
    this._objects = [];
    this.updatedFrozenObjects();
    this.dispatch('onCleared');
  }

  /**
   * Sorts this collection.
   *
   * @param {(a: T, b: T) => number} [compareFn]
   * @returns {this}
   */
  sort(compareFn?: (a: T, b: T) => number): this {
    if (!this._objects.length) return;
    this._objects.sort(compareFn);
    this.updatedFrozenObjects();
    this.dispatch('onSorted');
    return this;
  }

  /**
   * Returns the objects of this collection that meet the condition specified in a callback function.
   *
   * @param {(value: T, index: number, array: ReadonlyArray<T>) => unknown} callbackfn
   * A function that accepts up to three arguments.
   * The filter method calls the `callbackfn` function one time for each object in the collection.
   * @param {any} thisArg An object to which the this keyword can refer in the callbackfn function.
   * If `thisArg` is omitted, undefined is used as the this value.
   * @returns {T[]} An array objects which met the condition.
   */
  filter(callbackfn: (value: T, index: number, array: ReadonlyArray<T>) => unknown, thisArg?: any): T[] {
    return this._objects.filter(callbackfn, thisArg);
  }

}

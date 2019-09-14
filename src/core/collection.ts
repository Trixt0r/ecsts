import { Dispatcher } from './dispatcher';

/**
 * The listener interface for a listener on an entity.
 *
 * @export
 * @interface CollectionListener
 */
export interface CollectionListener<T> {

  /**
   * Called as soon as new elements have been added to the collection.
   *
   * @param {T[]} elements
   */
  onAdded?(...elements: T[]): void;

  /**
   * Called as soon as new elements got removed from the collection.
   *
   * @param {T[]} elements
   */
  onRemoved?(...elements: T[]): void;

  /**
   * Called as soon as all elements got removed from the collection.
   */
  onCleared?(): void;

  /**
   * Called as soon as the elements got sorted.
   */
  onSorted?(): void;
}

/**
 * A collection holds a list of elements of a certain type
 * and allows to add, remove, sort and clear the list.
 * On each operation the internal list of elements gets frozen,
 * so a user of the collection will not be able to operate on the real reference,
 * but read the data without the need of copying the data on each read access.
 *
 * @export
 * @class Collection
 * @extends {Dispatcher<CollectionListener<T>>}
 * @template T
 * @todo Make this iterable.
 */
export class Collection<T> extends Dispatcher<CollectionListener<T>> implements IterableIterator<T> {

  /**
   * The internal list of elements.
   *
   * @protected
   * @type {T[]}
   */
  protected _elements: T[];

  /**
   * The frozen list of elements which is used to expose the element list to the public.
   *
   * @protected
   * @type {T[]}
   */
  protected _frozenElements: T[];


  protected pointer = 0;

  /**
   * Creates an instance of Collection.
   *
   * @param {T[]} [initial=[]] An optional initial list of elements.
   */
  constructor(initial: T[] = []) {
    super();
    this._elements = initial.slice();
    this._frozenElements = [];
    this.updatedFrozenObjects();
  }

  /**
   * @inheritdoc
   */
  public next(): IteratorResult<T> {
    if (this.pointer < this._elements.length) {
      return {
        done: false,
        value: this._elements[this.pointer++]
      }
    } else {
      return <any>{
        done: true,
        value: null
      }
    }
  }

  /**
   * @inheritdoc
   */
  [Symbol.iterator](): IterableIterator<T> {
    this.pointer = 0;
    return this;
  }

  /**
   * A snapshot of all elements in this collection.
   *
   * @readonly
   * @type {T[]}
   */
  get elements(): readonly T[] {
    return this._frozenElements;
  }

  /**
   * The length, of this collection, i.e. how many elements this collection contains.
   *
   * @readonly
   * @type {number}
   */
  get length(): number {
    return this._frozenElements.length;
  }

  /**
   * Updates the internal frozen element list.
   *
   * @protected
   */
  protected updatedFrozenObjects(): void {
    this._frozenElements = this._elements.slice();
    Object.freeze(this._frozenElements);
  }

  /**
   * Adds the given element to this collection.
   *
   * @param {T} element
   * @returns {boolean} Whether the element has been added or not.
   *                    It may not be added, if already present in the element list.
   */
  protected addSingle(element: T): boolean {
    if (this._elements.indexOf(element) >= 0) return false;
    this._elements.push(element);
    return true;
  }

  /**
   * Adds the given element(s) to this collection.
   *
   * @param {T[]} elements
   * @returns {boolean} Whether elements have been added or not.
   *                    They may not have been added, if they were already present in the element list.
   */
  add(...elements: T[]): boolean {
    const added: T[] = elements.filter(element => this.addSingle(element));
    const re = added.length > 0;
    if (re) {
      this.updatedFrozenObjects();
      this.dispatch.apply(this, <['onAdded', ...T[]]>['onAdded', ...added]);
    }
    return re;
  }

  /**
   * Removes the given element or the element at the given index.
   *
   * @param {(T | number)} elementOrIndex
   * @returns {boolean} Whether the element has been removed or not.
   *                    It may not have been removed, if it was not in the element list.
   */
  protected removeSingle(elementOrIndex: T | number): boolean {
    const idx = typeof elementOrIndex === 'number' ? elementOrIndex : this._elements.indexOf(elementOrIndex);
    if (idx >= 0 && idx < this._elements.length) {
      this._elements.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Removes the given element(s) or the elements at the given indices.
   *
   * @param {(T | number)[]} elementsOrIndices
   * @returns {boolean} Whether elements have been removed or not.
   *                    They may not have been removed, if every element was not in the element list.
   */
  remove(...elementsOrIndices: (T | number)[]): boolean {
    const elements = <T[]>elementsOrIndices.map(o => typeof o === 'number' ? this._elements[o] : o);
    const removed: T[] = elements.filter(element => this.removeSingle(element));
    const re = removed.length > 0;
    if (re) {
      this.updatedFrozenObjects();
      this.dispatch.apply(this, <['onRemoved', ...T[]]>['onRemoved', ...removed]);
    }
    return re;
  }

  /**
   * Clears this collection, i.e. removes all elements from the internal list.
   */
  clear(): void {
    if (!this._elements.length) return;
    this._elements = [];
    this.updatedFrozenObjects();
    this.dispatch('onCleared');
  }

  /**
   * Returns the index of the given element.
   *
   * @param {T} element The element.
   * @returns {number} The index of the given element or id.
   */
  indexOf(element: T): number {
    return this._elements.indexOf(element);
  }

  /**
   * Sorts this collection.
   *
   * @param {(a: T, b: T) => number} [compareFn]
   * @returns {this}
   */
  sort(compareFn?: (a: T, b: T) => number): this {
    if (!this._elements.length) return this;
    this._elements.sort(compareFn);
    this.updatedFrozenObjects();
    this.dispatch('onSorted');
    return this;
  }

  /**
   * Returns the elements of this collection that meet the condition specified in a callback function.
   *
   * @param {(value: T, index: number, array: readonly T[]) => unknown} callbackfn
   * A function that accepts up to three arguments.
   * The filter method calls the `callbackfn` function one time for each element in the collection.
   * @param {any} thisArg An object to which the this keyword can refer in the callbackfn function.
   * If `thisArg` is omitted, undefined is used as the this value.
   * @returns {T[]} An array with elements which met the condition.
   */
  filter(callbackfn: (value: T, index: number, array: readonly T[]) => unknown, thisArg?: any): T[] {
    return this._elements.filter(callbackfn, thisArg);
  }

  /**
   * Performs the specified action for each element in the collection.
   *
   * @param {(element: T, index: number, array: T[]) => void} callbackFn
   * A function that accepts up to three arguments.
   * forEach calls the callbackfn function one time for each element in the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  forEach(callbackFn: (element: T, index: number, array: readonly T[]) => void, thisArg?: any): void {
    this._elements.forEach(callbackFn, thisArg);
  }

  /**
   * Returns the value of the first element in the collection where predicate is true, and undefined
   * otherwise.
   *
   * @param {(element: T, index: number, array: readonly T[]) => unknown} predicate
   * Find calls predicate once for each element of the array, in ascending order,
   * until it finds one where predicate returns true. If such an element is found, find
   * immediately returns that element value. Otherwise, find returns undefined.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   * @returns {T | undefined}
   */
  find(predicate: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: any): T | undefined {
    return this._elements.find(predicate, thisArg);
  }

  /**
   * Returns the index of the first element in the collection where predicate is true, and -1
   * otherwise.
   *
   * @param {(entity: T, index: number, array: readonly T[]) => unknown} predicate
   * Find calls predicate once for each element of the array, in ascending order,
   * until it finds one where predicate returns true. If such an element is found,
   * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   * @returns {number}
   */
  findIndex(predicate: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: any): number {
    return this._elements.findIndex(predicate, thisArg);
  }

  /**
   * Calls a defined callback function on each element of an collection, and returns an array that contains the results.
   *
   * @param {(entity: T, index: number, array: readonly T[]) => U} callbackFn
   * A function that accepts up to three arguments.
   * The map method calls the callbackfn function one time for each element in the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   * @returns {U[]}
   */
  map<U>(callbackFn: (element: T, index: number, array: readonly T[]) => U, thisArg?: any): U[] {
    return this._elements.map(callbackFn, thisArg);
  }

  /**
   *
   * Determines whether all the members of the collection satisfy the specified test.
   *
   * @param {(entity: T, index: number, array: readonly T[]) => unknown} callbackFn
   * A function that accepts up to three arguments.
   * The every method calls the callbackfn function for each element in array1 until the callbackfn
   * returns false, or until the end of the array.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   * @returns {boolean}
   */
  every(callbackFn: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: any): boolean {
    return this._elements.every(callbackFn, thisArg);
  }

  /**
   * Determines whether the specified callback function returns true for any element of the collection.
   *
   * @param {(entity: T, index: number, array: readonly T[]) => unknown} callbackFn
   * A function that accepts up to three arguments.
   * The some method calls the callbackfn function for each element in the collection until the callbackfn
   * returns true, or until the end of the collection.
   * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
   * If thisArg is omitted, undefined is used as the this value.
   * @returns {boolean}
   */
  some(callbackFn: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: any): boolean {
    return this._elements.some(callbackFn, thisArg);
  }

  /**
   * Calls the specified callback function for all the elements in the collection.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * @param {(previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U} callbackFn
   * A function that accepts up to four arguments.
   * The reduce method calls the callbackfn function one time for each element in the array.
   * @param {U} initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
   * The first call to the callbackfn function provides this value as an argument instead of
   * an collection value.
   * @returns {U}
   */
  reduce<U>(
    callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U,
    initialValue: U
  ): U {
    return this._elements.reduce(callbackFn, initialValue);
  }

  /**
   * Calls the specified callback function for all the elements in the collection, in descending order.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   *
   * @param {(previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U} callbackFn
   * @param {U} initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
   *                         The first call to the callbackfn function provides this value as an argument instead of
   *                         an collection value.
   * @returns {U}
   */
  reduceRight<U>(
    callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U,
    initialValue: U
  ): U {
    return this._elements.reduceRight(callbackFn, initialValue);
  }

}

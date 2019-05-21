import { Dispatcher } from "./dispatcher";
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
export class Collection extends Dispatcher {
    /**
     * Creates an instance of Collection.
     *
     * @param {T[]} [initial=[]] An optional initial list of elements.
     */
    constructor(initial = []) {
        super();
        this._elements = initial.slice();
        this.updatedFrozenObjects();
    }
    /**
     * A snapshot of all elements in this collection.
     *
     * @readonly
     * @type {T[]}
     */
    get elements() {
        return this._frozenElements;
    }
    /**
     * The length, of this collection, i.e. how many elements this collection contains.
     *
     * @readonly
     * @type {number}
     */
    get length() {
        return this._frozenElements.length;
    }
    /**
     * Updates the internal frozen element list.
     *
     * @protected
     */
    updatedFrozenObjects() {
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
    addSingle(element) {
        if (this._elements.indexOf(element) >= 0)
            return false;
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
    add(...elements) {
        const added = elements.filter(element => this.addSingle(element));
        const re = added.length > 0;
        if (re) {
            this.updatedFrozenObjects();
            added.unshift('onAdded');
            this.dispatch.apply(this, added);
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
    removeSingle(elementOrIndex) {
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
    remove(...elementsOrIndices) {
        const elements = elementsOrIndices.map(o => typeof o === 'number' ? this._elements[o] : o);
        const removed = elements.filter(element => this.removeSingle(element));
        const re = removed.length > 0;
        if (re) {
            this.updatedFrozenObjects();
            removed.unshift('onRemoved');
            this.dispatch.apply(this, removed);
        }
        return re;
    }
    /**
     * Clears this collection, i.e. removes all elements from the internal list.
     */
    clear() {
        if (!this._elements.length)
            return;
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
    indexOf(element) {
        return this._elements.indexOf(element);
    }
    /**
     * Sorts this collection.
     *
     * @param {(a: T, b: T) => number} [compareFn]
     * @returns {this}
     */
    sort(compareFn) {
        if (!this._elements.length)
            return;
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
    filter(callbackfn, thisArg) {
        return this._elements.filter(callbackfn, thisArg);
    }
    /**
     * Performs the specified action for each element in the collection.
     *
     * @param {(element: T, index: number, array: T[]) => any} callbackFn
     * A function that accepts up to three arguments.
     * forEach calls the callbackfn function one time for each element in the array.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    forEach(callbackFn, thisArg) {
        this._elements.forEach(callbackFn, thisArg);
    }
    /**
     * Returns the value of the first element in the collection where predicate is true, and undefined
     * otherwise.
     *
     * @param {(element: T, index: number, array: readonly T[]) => any} predicate
     * Find calls predicate once for each element of the array, in ascending order,
     * until it finds one where predicate returns true. If such an element is found, find
     * immediately returns that element value. Otherwise, find returns undefined.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     * @returns {T}
     */
    find(predicate, thisArg) {
        return this._elements.find(predicate, thisArg);
    }
    /**
     * Returns the index of the first element in the collection where predicate is true, and -1
     * otherwise.
     *
     * @param {(entity: T, index: number, array: readonly T[]) => any} predicate
     * Find calls predicate once for each element of the array, in ascending order,
     * until it finds one where predicate returns true. If such an element is found,
     * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     * @returns {number}
     */
    findIndex(predicate, thisArg) {
        return this._elements.findIndex(predicate, thisArg);
    }
    /**
     * Calls a defined callback function on each element of an collection, and returns an array that contains the results.
     *
     * @param {(entity: T, index: number, array: readonly T[]) => any} callbackFn
     * A function that accepts up to three arguments.
     * The map method calls the callbackfn function one time for each element in the array.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     * @returns {any[]}
     */
    map(callbackFn, thisArg) {
        return this._elements.map(callbackFn, thisArg);
    }
    /**
     *
     * Determines whether all the members of the collection satisfy the specified test.
     *
     * @param {(entity: T, index: number, array: readonly T[]) => any} callbackFn
     * A function that accepts up to three arguments.
     * The every method calls the callbackfn function for each element in array1 until the callbackfn
     * returns false, or until the end of the array.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     * @returns {boolean}
     */
    every(callbackFn, thisArg) {
        return this._elements.every(callbackFn, thisArg);
    }
    /**
     * Determines whether the specified callback function returns true for any element of the collection.
     *
     * @param {(entity: T, index: number, array: readonly T[]) => any} callbackFn
     * A function that accepts up to three arguments.
     * The some method calls the callbackfn function for each element in the collection until the callbackfn
     * returns true, or until the end of the collection.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     * @returns {boolean}
     */
    some(callbackFn, thisArg) {
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
    reduce(callbackFn, initialValue) {
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
    reduceRight(callbackFn, initialValue) {
        return this._elements.reduceRight(callbackFn, initialValue);
    }
}

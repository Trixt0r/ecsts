"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var dispatcher_1 = require("./dispatcher");
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
var Collection = /** @class */ (function (_super) {
    __extends(Collection, _super);
    /**
     * Creates an instance of Collection.
     *
     * @param {T[]} [initial=[]] An optional initial list of elements.
     */
    function Collection(initial) {
        if (initial === void 0) { initial = []; }
        var _this = _super.call(this) || this;
        _this.pointer = 0;
        _this._elements = initial.slice();
        _this._frozenElements = [];
        _this.updatedFrozenObjects();
        return _this;
    }
    /**
     * @inheritdoc
     */
    Collection.prototype.next = function () {
        if (this.pointer < this._elements.length) {
            return {
                done: false,
                value: this._elements[this.pointer++]
            };
        }
        else {
            return {
                done: true,
                value: null
            };
        }
    };
    /**
     * @inheritdoc
     */
    Collection.prototype[Symbol.iterator] = function () {
        this.pointer = 0;
        return this;
    };
    Object.defineProperty(Collection.prototype, "elements", {
        /**
         * A snapshot of all elements in this collection.
         *
         * @readonly
         * @type {T[]}
         */
        get: function () {
            return this._frozenElements;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Collection.prototype, "length", {
        /**
         * The length, of this collection, i.e. how many elements this collection contains.
         *
         * @readonly
         * @type {number}
         */
        get: function () {
            return this._frozenElements.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Updates the internal frozen element list.
     *
     * @protected
     */
    Collection.prototype.updatedFrozenObjects = function () {
        this._frozenElements = this._elements.slice();
        Object.freeze(this._frozenElements);
    };
    /**
     * Adds the given element to this collection.
     *
     * @param {T} element
     * @returns {boolean} Whether the element has been added or not.
     *                    It may not be added, if already present in the element list.
     */
    Collection.prototype.addSingle = function (element) {
        if (this._elements.indexOf(element) >= 0)
            return false;
        this._elements.push(element);
        return true;
    };
    /**
     * Adds the given element(s) to this collection.
     *
     * @param {T[]} elements
     * @returns {boolean} Whether elements have been added or not.
     *                    They may not have been added, if they were already present in the element list.
     */
    Collection.prototype.add = function () {
        var _this = this;
        var elements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elements[_i] = arguments[_i];
        }
        var added = elements.filter(function (element) { return _this.addSingle(element); });
        var re = added.length > 0;
        if (re) {
            this.updatedFrozenObjects();
            this.dispatch.apply(this, __spread(['onAdded'], added));
        }
        return re;
    };
    /**
     * Removes the given element or the element at the given index.
     *
     * @param {(T | number)} elementOrIndex
     * @returns {boolean} Whether the element has been removed or not.
     *                    It may not have been removed, if it was not in the element list.
     */
    Collection.prototype.removeSingle = function (elementOrIndex) {
        var idx = typeof elementOrIndex === 'number' ? elementOrIndex : this._elements.indexOf(elementOrIndex);
        if (idx >= 0 && idx < this._elements.length) {
            this._elements.splice(idx, 1);
            return true;
        }
        return false;
    };
    /**
     * Removes the given element(s) or the elements at the given indices.
     *
     * @param {(T | number)[]} elementsOrIndices
     * @returns {boolean} Whether elements have been removed or not.
     *                    They may not have been removed, if every element was not in the element list.
     */
    Collection.prototype.remove = function () {
        var _this = this;
        var elementsOrIndices = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elementsOrIndices[_i] = arguments[_i];
        }
        var elements = elementsOrIndices.map(function (o) { return typeof o === 'number' ? _this._elements[o] : o; });
        var removed = elements.filter(function (element) { return _this.removeSingle(element); });
        var re = removed.length > 0;
        if (re) {
            this.updatedFrozenObjects();
            this.dispatch.apply(this, __spread(['onRemoved'], removed));
        }
        return re;
    };
    /**
     * Clears this collection, i.e. removes all elements from the internal list.
     */
    Collection.prototype.clear = function () {
        if (!this._elements.length)
            return;
        this._elements = [];
        this.updatedFrozenObjects();
        this.dispatch('onCleared');
    };
    /**
     * Returns the index of the given element.
     *
     * @param {T} element The element.
     * @returns {number} The index of the given element or id.
     */
    Collection.prototype.indexOf = function (element) {
        return this._elements.indexOf(element);
    };
    /**
     * Sorts this collection.
     *
     * @param {(a: T, b: T) => number} [compareFn]
     * @returns {this}
     */
    Collection.prototype.sort = function (compareFn) {
        if (!this._elements.length)
            return this;
        this._elements.sort(compareFn);
        this.updatedFrozenObjects();
        this.dispatch('onSorted');
        return this;
    };
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
    Collection.prototype.filter = function (callbackfn, thisArg) {
        return this._elements.filter(callbackfn, thisArg);
    };
    /**
     * Performs the specified action for each element in the collection.
     *
     * @param {(element: T, index: number, array: T[]) => void} callbackFn
     * A function that accepts up to three arguments.
     * forEach calls the callbackfn function one time for each element in the array.
     * @param {any} [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    Collection.prototype.forEach = function (callbackFn, thisArg) {
        this._elements.forEach(callbackFn, thisArg);
    };
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
    Collection.prototype.find = function (predicate, thisArg) {
        return this._elements.find(predicate, thisArg);
    };
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
    Collection.prototype.findIndex = function (predicate, thisArg) {
        return this._elements.findIndex(predicate, thisArg);
    };
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
    Collection.prototype.map = function (callbackFn, thisArg) {
        return this._elements.map(callbackFn, thisArg);
    };
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
    Collection.prototype.every = function (callbackFn, thisArg) {
        return this._elements.every(callbackFn, thisArg);
    };
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
    Collection.prototype.some = function (callbackFn, thisArg) {
        return this._elements.some(callbackFn, thisArg);
    };
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
    Collection.prototype.reduce = function (callbackFn, initialValue) {
        return this._elements.reduce(callbackFn, initialValue);
    };
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
    Collection.prototype.reduceRight = function (callbackFn, initialValue) {
        return this._elements.reduceRight(callbackFn, initialValue);
    };
    return Collection;
}(dispatcher_1.Dispatcher));
exports.Collection = Collection;

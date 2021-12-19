import { Dispatcher } from './dispatcher';
/**
 * The listener interface for a listener on an entity.
 */
export interface CollectionListener<T> {
    /**
     * Called as soon as new elements have been added to the collection.
     *
     * @param elements
     */
    onAdded?(...elements: T[]): void;
    /**
     * Called as soon as new elements got removed from the collection.
     *
     * @param elements
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
 */
export declare class Collection<T> extends Dispatcher<CollectionListener<T>> implements IterableIterator<T> {
    /**
     * The internal list of elements.
     */
    protected _elements: T[];
    /**
     * The frozen list of elements which is used to expose the element list to the public.
     */
    protected _frozenElements: T[];
    /**
     * The internal iterator pointer.
     */
    protected pointer: number;
    /**
     * Creates an instance of Collection.
     *
     * @param initial An optional initial list of elements.
     */
    constructor(initial?: T[]);
    /**
     * @inheritdoc
     */
    next(): IteratorResult<T>;
    /**
     * @inheritdoc
     */
    [Symbol.iterator](): IterableIterator<T>;
    /**
     * A snapshot of all elements in this collection.
     */
    get elements(): readonly T[];
    /**
     * The length, of this collection, i.e. how many elements this collection contains.
     */
    get length(): number;
    /**
     * Updates the internal frozen element list.
     */
    protected updatedFrozenObjects(): void;
    /**
     * Adds the given element to this collection.
     *
     * @param element
     * @return Whether the element has been added or not.
     *                    It may not be added, if already present in the element list.
     */
    protected addSingle(element: T): boolean;
    /**
     * Adds the given element(s) to this collection.
     *
     * @param elements
     * @return Whether elements have been added or not.
     *                    They may not have been added, if they were already present in the element list.
     */
    add(...elements: T[]): boolean;
    /**
     * Removes the given element or the element at the given index.
     *
     * @param elementOrIndex
     * @return Whether the element has been removed or not.
     *                    It may not have been removed, if it was not in the element list.
     */
    protected removeSingle(elementOrIndex: T | number): boolean;
    /**
     * Removes the given element(s) or the elements at the given indices.
     *
     * @param elementsOrIndices
     * @return Whether elements have been removed or not.
     *                    They may not have been removed, if every element was not in the element list.
     */
    remove(...elementsOrIndices: (T | number)[]): boolean;
    /**
     * Clears this collection, i.e. removes all elements from the internal list.
     */
    clear(): void;
    /**
     * Returns the index of the given element.
     *
     * @param element The element.
     * @return The index of the given element or id.
     */
    indexOf(element: T): number;
    /**
     * Sorts this collection.
     *
     * @param [compareFn]
     *
     */
    sort(compareFn?: (a: T, b: T) => number): this;
    /**
     * Returns the elements of this collection that meet the condition specified in a callback function.
     *
     * @param callbackfn
     * A function that accepts up to three arguments.
     * The filter method calls the `callbackfn` function one time for each element in the collection.
     * @param thisArg An object to which the this keyword can refer in the callbackfn function.
     * If `thisArg` is omitted, undefined is used as the this value.
     * @return An array with elements which met the condition.
     */
    filter<U>(callbackfn: (value: T, index: number, array: readonly T[]) => unknown, thisArg?: U): T[];
    /**
     * Performs the specified action for each element in the collection.
     *
     * @param callbackFn
     * A function that accepts up to three arguments.
     * forEach calls the callbackfn function one time for each element in the array.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     */
    forEach<U>(callbackFn: (element: T, index: number, array: readonly T[]) => void, thisArg?: U): void;
    /**
     * Returns the value of the first element in the collection where predicate is true, and undefined
     * otherwise.
     *
     * @param predicate
     * Find calls predicate once for each element of the array, in ascending order,
     * until it finds one where predicate returns true. If such an element is found, find
     * immediately returns that element value. Otherwise, find returns undefined.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     *
     */
    find<U>(predicate: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: U): T | undefined;
    /**
     * Returns the index of the first element in the collection where predicate is true, and -1
     * otherwise.
     *
     * @param predicate
     * Find calls predicate once for each element of the array, in ascending order,
     * until it finds one where predicate returns true. If such an element is found,
     * findIndex immediately returns that element index. Otherwise, findIndex returns -1.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     *
     */
    findIndex<U>(predicate: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: U): number;
    /**
     * Calls a defined callback function on each element of an collection, and returns an array that contains the results.
     *
     * @param callbackFn
     * A function that accepts up to three arguments.
     * The map method calls the callbackfn function one time for each element in the array.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     *
     */
    map<U, V>(callbackFn: (element: T, index: number, array: readonly T[]) => V, thisArg?: U): V[];
    /**
     *
     * Determines whether all the members of the collection satisfy the specified test.
     *
     * @param callbackFn
     * A function that accepts up to three arguments.
     * The every method calls the callbackfn function for each element in array1 until the callbackfn
     * returns false, or until the end of the array.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     *
     */
    every<U>(callbackFn: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: U): boolean;
    /**
     * Determines whether the specified callback function returns true for any element of the collection.
     *
     * @param callbackFn
     * A function that accepts up to three arguments.
     * The some method calls the callbackfn function for each element in the collection until the callbackfn
     * returns true, or until the end of the collection.
     * @param [thisArg] An object to which the this keyword can refer in the callbackfn function.
     * If thisArg is omitted, undefined is used as the this value.
     *
     */
    some<U>(callbackFn: (element: T, index: number, array: readonly T[]) => unknown, thisArg?: U): boolean;
    /**
     * Calls the specified callback function for all the elements in the collection.
     * The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     *
     * @param callbackFn
     * A function that accepts up to four arguments.
     * The reduce method calls the callbackfn function one time for each element in the array.
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
     * The first call to the callbackfn function provides this value as an argument instead of
     * an collection value.
     *
     */
    reduce<U>(callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U, initialValue: U): U;
    /**
     * Calls the specified callback function for all the elements in the collection, in descending order.
     * The return value of the callback function is the accumulated result,
     * and is provided as an argument in the next call to the callback function.
     *
     * @param callbackFn
     * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation.
     *                         The first call to the callbackfn function provides this value as an argument instead of
     *                         an collection value.
     *
     */
    reduceRight<U>(callbackFn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U, initialValue: U): U;
}

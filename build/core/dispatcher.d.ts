import { ArgumentTypes } from "./types";
/**
 * A dispatcher is an abstract object which holds a list of listeners
 * to which data during certain events can be dispatched, by calling functions implemented by listeners.
 *
 * @export
 * @abstract
 * @class Dispatcher
 * @template T The listener type, which has to implemented by the listeners.
 */
export declare abstract class Dispatcher<T> {
    /**
     * The list of listeners for this dispatcher.
     *
     * @protected
     * @type {Partial<T>[]}
     */
    protected _listeners: Partial<T>[];
    /**
     * Locked listeners.
     * Those listeners in this array can not be removed anymore.
     *
     * @protected
     * @type {Partial<T>}
     */
    protected _lockedListeners: Partial<T>[];
    /**
     * Creates an instance of Dispatcher.
     */
    constructor();
    /**
     * The current listeners for this dispatcher.
     *
     * @readonly
     * @type {T[]}
     */
    readonly listeners: readonly Partial<T>[];
    /**
     * Adds the given listener to this entity.
     *
     * @param {Partial<T>} listener
     * @returns {boolean} Whether the listener has been added or not.
     *                    It may not be added, if already present in the listener list.
     */
    addListener(listener: Partial<T>, lock?: boolean): boolean;
    /**
     * Removes the given listener or the listener at the given index.
     *
     * @param {(Partial<T> | number)} listenerOrIndex
     * @returns {boolean} Whether the listener has been removed or not.
     *                    It may not have been removed, if it was not in the listener list.
     */
    removeListener(listenerOrIndex: Partial<T> | number): boolean;
    /**
     * Dispatches the given arguments by calling the given function name
     * on each listener, if implemented.
     * Note that the listener's scope will be used, when the listener's function gets called.
     *
     * @param {extends keyof T} name The function name to call.
     * @param {ArgumentTypes<T[K]>} args The arguments to pass to the function.
     */
    dispatch<K extends keyof T>(name: K, ...args: ArgumentTypes<T[K]>): void;
}

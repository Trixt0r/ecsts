import { ArgumentTypes } from './types';
/**
 * A dispatcher is an abstract object which holds a list of listeners
 * to which data during certain events can be dispatched, by calling functions implemented by listeners.
 *
 */
export declare abstract class Dispatcher<T> {
    /**
     * The list of listeners for this dispatcher.
     */
    protected _listeners: Partial<T>[];
    /**
     * Locked listeners.
     * Those listeners in this array can not be removed anymore.
     */
    protected _lockedListeners: Partial<T>[];
    /**
     * Creates an instance of Dispatcher.
     */
    constructor();
    /**
     * The current listeners for this dispatcher.
     */
    get listeners(): readonly Partial<T>[];
    /**
     * Adds the given listener to this entity.
     *
     * @param listener
     * @return Whether the listener has been added or not.
     *                    It may not be added, if already present in the listener list.
     */
    addListener(listener: Partial<T>, lock?: boolean): boolean;
    /**
     * Removes the given listener or the listener at the given index.
     *
     * @param listenerOrIndex
     * @return Whether the listener has been removed or not.
     *                    It may not have been removed, if it was not in the listener list.
     */
    removeListener(listenerOrIndex: Partial<T> | number): boolean;
    /**
     * Dispatches the given arguments by calling the given function name
     * on each listener, if implemented.
     * Note that the listener's scope will be used, when the listener's function gets called.
     *
     * @param name The function name to call.
     * @param args The arguments to pass to the function.
     */
    dispatch<K extends keyof T>(name: K, ...args: ArgumentTypes<T[K]>): void;
}

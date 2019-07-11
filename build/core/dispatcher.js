/**
 * A dispatcher is an abstract object which holds a list of listeners
 * to which data during certain events can be dispatched, by calling functions implemented by listeners.
 *
 * @export
 * @abstract
 * @class Dispatcher
 * @template T The listener type, which has to implemented by the listeners.
 */
export class Dispatcher {
    /**
     * Creates an instance of Dispatcher.
     */
    constructor() {
        this._listeners = [];
        this._lockedListeners = [];
    }
    /**
     * The current listeners for this dispatcher.
     *
     * @readonly
     * @type {T[]}
     */
    get listeners() {
        return this._listeners.slice();
    }
    /**
     * Adds the given listener to this entity.
     *
     * @param {Partial<T>} listener
     * @returns {boolean} Whether the listener has been added or not.
     *                    It may not be added, if already present in the listener list.
     */
    addListener(listener, lock = false) {
        if (this._listeners.indexOf(listener) >= 0)
            return false;
        this._listeners.push(listener);
        if (lock)
            this._lockedListeners.push(listener);
        return true;
    }
    /**
     * Removes the given listener or the listener at the given index.
     *
     * @param {(Partial<T> | number)} listenerOrIndex
     * @returns {boolean} Whether the listener has been removed or not.
     *                    It may not have been removed, if it was not in the listener list.
     */
    removeListener(listenerOrIndex) {
        const idx = typeof listenerOrIndex === 'number' ? listenerOrIndex : this._listeners.indexOf(listenerOrIndex);
        if (idx >= 0 && idx < this._listeners.length) {
            const listener = this._listeners[idx];
            const isLocked = this._lockedListeners.indexOf(listener) >= 0;
            if (isLocked)
                throw new Error(`Listener at index ${idx} is locked.`);
            this._listeners.splice(idx, 1);
            return true;
        }
        return false;
    }
    /**
     * Dispatches the given arguments by calling the given function name
     * on each listener, if implemented.
     * Note that the listener's scope will be used, when the listener's function gets called.
     *
     * @param {extends keyof T} name The function name to call.
     * @param {ArgumentTypes<T[K]>} args The arguments to pass to the function.
     */
    dispatch(name, ...args) {
        // TODO: optimize this; cache the listeners with the given function name
        this._listeners.forEach(listener => {
            const fn = listener[name];
            if (typeof fn !== 'function')
                return;
            fn.apply(listener, args);
        });
    }
}

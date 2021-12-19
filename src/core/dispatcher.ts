import { ArgumentTypes } from './types';

/**
 * A dispatcher is an abstract object which holds a list of listeners
 * to which data during certain events can be dispatched, by calling functions implemented by listeners.
 *
 */
export abstract class Dispatcher<T> {
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
  constructor() {
    this._listeners = [];
    this._lockedListeners = [];
  }

  /**
   * The current listeners for this dispatcher.
   */
  get listeners(): readonly Partial<T>[] {
    return this._listeners.slice();
  }

  /**
   * Adds the given listener to this entity.
   *
   * @param listener
   * @return Whether the listener has been added or not.
   *                    It may not be added, if already present in the listener list.
   */
  addListener(listener: Partial<T>, lock = false): boolean {
    if (this._listeners.indexOf(listener) >= 0) return false;
    this._listeners.push(listener);
    if (lock) this._lockedListeners.push(listener);
    return true;
  }

  /**
   * Removes the given listener or the listener at the given index.
   *
   * @param listenerOrIndex
   * @return Whether the listener has been removed or not.
   *                    It may not have been removed, if it was not in the listener list.
   */
  removeListener(listenerOrIndex: Partial<T> | number): boolean {
    const idx = typeof listenerOrIndex === 'number' ? listenerOrIndex : this._listeners.indexOf(listenerOrIndex);
    if (idx >= 0 && idx < this._listeners.length) {
      const listener = this._listeners[idx];
      const isLocked = this._lockedListeners.indexOf(listener) >= 0;
      if (isLocked) throw new Error(`Listener at index ${idx} is locked.`);
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
   * @param name The function name to call.
   * @param args The arguments to pass to the function.
   */
  dispatch<K extends keyof T>(name: K, ...args: ArgumentTypes<T[K]>): void {
    // TODO: optimize this; cache the listeners with the given function name
    this._listeners.forEach(listener => {
      const fn = listener[name];
      if (typeof fn !== 'function') return;
      fn.apply(listener, args);
    });
  }
}

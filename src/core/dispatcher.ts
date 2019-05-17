/**
 * A dispatcher is an abstract object which holds a list of listeners
 * to which data during certain events can be dispatched, by calling functions implemented by listeners.
 *
 * @export
 * @abstract
 * @class Dispatcher
 * @template T The listener type, which has to implemented by the listeners.
 */
export abstract class Dispatcher<T> {

  /**
   * The list of listeners for this dispatcher.
   *
   * @protected
   * @type {Partial<T>[]}
   */
  protected _listeners: Partial<T>[];

  /**
   * Creates an instance of Dispatcher.
   */
  constructor() {
    this._listeners = [];
  }

  /**
   * The current listeners for this dispatcher.
   *
   * @readonly
   * @type {T[]}
   */
  get listeners(): readonly Partial<T>[] {
    return this._listeners.slice();
  }

  /**
   * Adds the given listener to this entity.
   *
   * @param {Partial<T>} listener
   * @returns {boolean} Whether the listener has been added or not.
   *                    It may not be added, if already present in the listener list.
   */
  addListener(listener: Partial<T>): boolean {
    if (this._listeners.indexOf(listener) >= 0) return false;
    this._listeners.push(listener);
    return true;
  }

  /**
   * Removes the given listener or the listener at the given index.
   *
   * @param {(Partial<T> | number)} listenerOrIndex
   * @returns {boolean} Whether the listener has been removed or not.
   *                    It may not have been removed, if it was not in the listener list.
   */
  removeListener(listenerOrIndex: Partial<T> | number): boolean {
    const idx = typeof listenerOrIndex === 'number' ? listenerOrIndex : this._listeners.indexOf(listenerOrIndex);
    if (idx >= 0 && idx < this._listeners.length) {
      this._listeners.splice(idx);
      return true;
    }
    return false;
  }

  /**
   * Dispatches the given arguments by calling the given function name
   * on each listener, if implemented.
   * Note that the listener's scope will be used, when the listener's function gets called.
   *
   * @param {keyof Partial<T>} name The function name to call.
   * @param {...any[]} args The arguments to pass to the function.
   */
  dispatch(name: keyof T, ...args: any[]): void {
    // TODO: optimize this; cache the listeners with the given function name
    this._listeners.forEach(listener => {
      const fn = listener[name];
      if (typeof fn !== 'function') return;
      fn.apply(listener, args);
    });
  }

}

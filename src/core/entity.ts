import { Component } from "./component";

/**
 * The listener interface for a listener on an entity.
 *
 * @export
 * @interface EntityListener
 */
export interface EntityListener {

  /**
   * Called as soon as a new component as been added to the entity.
   *
   * @param {Component} component
   */
  onAddedComponent?(component: Component): void;

  /**
   * Called as soon as a component got removed from the entity.
   *
   * @param {Component} component
   */
  onRemovedComponent?(component: Component): void;
}

/**
 * An Entity holds an id and a list of components attached to it.
 * You can add or remove components from the entity.
 *
 * @export
 * @abstract
 * @class Entity
 */
export abstract class Entity {

  /**
   * The internal list of components.
   *
   * @protected
   * @type {Component[]}
   */
  protected _components: Component[];

  /**
   * The seald list of components which is used to expose it to others.
   *
   * @protected
   * @type {Component[]}
   */
  protected _sealedComponents: Component[];

  /**
   * The list of entity listeners for this entity.
   *
   * @protected
   * @type {EntityListener[]}
   */
  protected _listeners: EntityListener[];

  /**
   * Creates an instance of Entity.
   * @param {string} id The id, you should provide by yourself. Maybe an uuid or a simple number.
   */
  constructor(public readonly id: number | string) {
    this._components = [];
    this._listeners = [];
    this.updatedSealedComponents();
  }

  /**
   * A snapshot of all components of this entity.
   *
   * @readonly
   * @type {Component[]}
   */
  get components(): Component[] {
    return this._sealedComponents;
  }

  /**
   * Updates the internal sealed components list.
   *
   * @protected
   */
  protected updatedSealedComponents(): void {
    this._sealedComponents = this._components.slice();
    Object.seal(this._sealedComponents);
  }

  /**
   * Adds the given component to this entity.
   *
   * @param {Component} component
   * @returns {boolean} Whether the component has been added or not.
   *                    It may not be added, if already present in the component list.
   */
  addComponent(component: Component): boolean {
    if (this._components.indexOf(component) >= 0) return false;
    this._components.push(component);
    this.updatedSealedComponents();
    this._listeners.forEach(listener => {
      if (typeof listener.onAddedComponent === 'function')
        listener.onAddedComponent(component)
    });
    return true;
  }

  /**
   * Removes the given component or the component at the given index.
   *
   * @param {(Component | number)} componentOrIndex
   * @returns {boolean} Whether the component has been removed or not.
   *                    It may not have been removed, if it was not in the component list.
   */
  removeComponent(componentOrIndex: Component | number): boolean {
    const idx = typeof componentOrIndex === 'number' ? componentOrIndex : this._components.indexOf(componentOrIndex);
    if (idx >= 0 && idx < this._components.length) {
      const comp = typeof componentOrIndex === 'number' ? this._components[componentOrIndex] : componentOrIndex;
      this._components.splice(idx);
      this.updatedSealedComponents();
      this._listeners.forEach(listener => {
        if (typeof listener.onRemovedComponent === 'function')
          listener.onRemovedComponent(comp)
      });
      return true;
    }
    return false;
  }

  /**
   * Adds the given listener to this entity.
   *
   * @param {EntityListener} component
   * @returns {boolean} Whether the listener has been added or not.
   *                    It may not be added, if already present in the listener list.
   */
  addListener(listener: EntityListener): boolean {
    if (this._listeners.indexOf(listener) >= 0) return false;
    this._listeners.push(listener);
    return true;
  }

  /**
   * Removes the given listener or the listener at the given index.
   *
   * @param {(EntityListener | number)} listenerOrIndex
   * @returns {boolean} Whether the listener has been removed or not.
   *                    It may not have been removed, if it was not in the listener list.
   */
  removeListener(listenerOrIndex: EntityListener | number): boolean {
    const idx = typeof listenerOrIndex === 'number' ? listenerOrIndex : this._listeners.indexOf(listenerOrIndex);
    if (idx >= 0 && idx < this._listeners.length) {
      this._listeners.splice(idx);
      return true;
    }
    return false;
  }
}

import { Component } from "./component";
import { Dispatcher } from "./dispatcher";
import { Collection, CollectionListener } from "./collection";

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

  /**
   * Called as soon as all components got removed from the entity.
   */
  onClearedComponents?(): void;
}

/**
 * An Entity holds an id and a list of components attached to it.
 * You can add or remove components from the entity.
 *
 * @export
 * @abstract
 * @class Entity
 */
export abstract class Entity extends Dispatcher<EntityListener> implements CollectionListener<Component> {

  /**
   * The internal list of components.
   *
   * @protected
   * @type {Collection<Component>}
   */
  protected _components: Collection<Component>;

  /**
   * Creates an instance of Entity.
   *
   * @param {string} id The id, you should provide by yourself. Maybe an uuid or a simple number.
   */
  constructor(public readonly id: number | string) {
    super();
    this._components = new Collection<Component>();
    this._components.addListener(this);
  }

  /**
   * A snapshot of all components of this entity.
   *
   * @readonly
   * @type {Component[]}
   */
  get components(): Component[] {
    return this._components.objects;
  }

  /**
   * Adds the given component to this entity.
   *
   * @param {Component} component
   * @returns {boolean} Whether the component has been added or not.
   *                    It may not be added, if already present in the component list.
   */
  addComponent(component: Component): boolean {
    return this._components.add(component);
  }

  /**
   * Removes the given component or the component at the given index.
   *
   * @param {(Component | number)} componentOrIndex
   * @returns {boolean} Whether the component has been removed or not.
   *                    It may not have been removed, if it was not in the component list.
   */
  removeComponent(componentOrIndex: Component | number): boolean {
    return this._components.remove(componentOrIndex);
  }

  /**
   * Clears all components, i.e. removes all components from this entity.
   *
   * @returns {void}
   */
  clearComponents(): void {
    return this._components.clear();
  }

  /**
   * Dispatches the `onAdded` event to all listeners as `onAddedComponent`.
   *
   * @param {Component} component
   * @returns {void}
   */
  onAdded(component: Component): void {
    return this.dispatch('onAddedComponent', component);
  }

  /**
   * Dispatches the `onRemoved` event to all listeners as `onRemovedComponent`.
   *
   * @param {Component} component
   * @returns {void}
   */
  onRemoved(component: Component): void {
    return this.dispatch('onRemovedComponent', component);
  }

  /**
   * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
   *
   * @returns {void}
   */
  onCleared(): void {
    return this.dispatch('onClearedComponents');
  }
}

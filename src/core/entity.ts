import { Component, ComponentCollection } from "./component";
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
   * @param { Component[]} components The new added components.
   */
  onAddedComponents?(...components: Component[]): void;

  /**
   * Called as soon as a component got removed from the entity.
   *
   * @param { Component[]} components The removed components
   */
  onRemovedComponents?(...components: Component[]): void;

  /**
   * Called as soon as all components got removed from the entity.
   */
  onClearedComponents?(): void;

  /**
   * Called as soon as the components got sorted.
   */
  onSortedComponents?(): void;
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
   * @type {ComponentCollection}
   */
  protected _components: ComponentCollection;

  /**
   * Creates an instance of Entity.
   *
   * @param {string} id The id, you should provide by yourself. Maybe an uuid or a simple number.
   */
  constructor(public readonly id: number | string) {
    super();
    this._components = new ComponentCollection();
    this._components.addListener(this, true);
  }

  /**
   * A snapshot of all components of this entity.
   *
   * @readonly
   * @type {ComponentCollection}
   */
  get components(): ComponentCollection {
    return this._components;
  }

  /**
   * Dispatches the `onAdded` event to all listeners as `onAddedComponents`.
   *
   * @param {Component[]} components
   * @returns {void}
   */
  onAdded(...components: Component[]): void {
    const args = ['onAddedComponents'].concat(<any[]>components);
    return this.dispatch.apply(this, args)
  }

  /**
   * Dispatches the `onRemoved` event to all listeners as `onRemovedComponents`.
   *
   * @param {Component[]} components
   * @returns {void}
   */
  onRemoved(...components: Component[]): void {
    const args = ['onRemovedComponents'].concat(<any[]>components);
    return this.dispatch.apply(this, args)
  }

  /**
   * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
   *
   * @returns {void}
   */
  onCleared(): void {
    return this.dispatch('onClearedComponents');
  }

  /**
   * Dispatches the `onSorted` event to all listeners as `onSortedComponents`.
   *
   * @returns {void}
   */
  onSorted(): void {
    return this.dispatch('onSortedComponents');
  }
}

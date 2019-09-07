import { Component, ComponentCollection } from "./component";
import { Dispatcher } from "./dispatcher";
import { CollectionListener } from "./collection";

/**
 * The listener interface for a listener on an entity.
 *
 * @export
 * @interface EntityListener
 * @template C The component type.
 */
export interface EntityListener<C extends Component = Component> {

  /**
   * Called as soon as a new component as been added to the entity.
   *
   * @param {C[]} components The new added components.
   */
  onAddedComponents?(...components: C[]): void;

  /**
   * Called as soon as a component got removed from the entity.
   *
   * @param {C[]} components The removed components
   */
  onRemovedComponents?(...components: C[]): void;

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
 *
 * An Entity holds an id and a list of components attached to it.
 * You can add or remove components from the entity.
 *
 * @export
 * @abstract
 * @class Entity
 * @extends {Dispatcher<L>}
 * @implements {CollectionListener<C>}
 * @template C The component type.
 * @template L The listener type.
 */
export abstract class Entity<C extends Component = Component,
                             L extends EntityListener = EntityListener<C>>
                             extends Dispatcher<L>
                             implements CollectionListener<C> {

  /**
   * The internal list of components.
   *
   * @protected
   * @type {ComponentCollection}
   */
  protected _components: ComponentCollection<C>;

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
   * @type {ComponentCollection<C>}
   */
  get components(): ComponentCollection<C> {
    return this._components;
  }

  /**
   * Dispatches the `onAdded` event to all listeners as `onAddedComponents`.
   *
   * @param {C[]} components
   * @returns {void}
   */
  onAdded(...components: C[]): void {
    return (<Dispatcher<EntityListener>>this)
              .dispatch.apply(this, ['onAddedComponents', ...components]);
  }

  /**
   * Dispatches the `onRemoved` event to all listeners as `onRemovedComponents`.
   *
   * @param {Component[]} components
   * @returns {void}
   */
  onRemoved(...components: C[]): void {
    return (<Dispatcher<EntityListener>>this)
              .dispatch.apply(this, <['onRemovedComponents', ...Component[]]>['onRemovedComponents', ...components]);
  }

  /**
   * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
   *
   * @returns {void}
   */
  onCleared(): void {
    return (<Dispatcher<EntityListener>>this).dispatch('onClearedComponents');
  }

  /**
   * Dispatches the `onSorted` event to all listeners as `onSortedComponents`.
   *
   * @returns {void}
   */
  onSorted(): void {
    return (<Dispatcher<EntityListener>>this).dispatch('onSortedComponents');
  }
}

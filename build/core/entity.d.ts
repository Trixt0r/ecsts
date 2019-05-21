<<<<<<< HEAD
import { Component, ComponentCollection } from "./component";
import { Dispatcher } from "./dispatcher";
import { CollectionListener } from "./collection";
=======
import { Component } from "./component";
import { Dispatcher } from "./dispatcher";
import { Collection, CollectionListener } from "./collection";
>>>>>>> Emit alslo the declaration files.
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
export declare abstract class Entity extends Dispatcher<EntityListener> implements CollectionListener<Component> {
    readonly id: number | string;
    /**
     * The internal list of components.
     *
     * @protected
<<<<<<< HEAD
     * @type {ComponentCollection}
     */
    protected _components: ComponentCollection;
=======
     * @type {Collection<Component>}
     */
    protected _components: Collection<Component>;
>>>>>>> Emit alslo the declaration files.
    /**
     * Creates an instance of Entity.
     *
     * @param {string} id The id, you should provide by yourself. Maybe an uuid or a simple number.
     */
    constructor(id: number | string);
    /**
     * A snapshot of all components of this entity.
     *
     * @readonly
<<<<<<< HEAD
     * @type {ComponentCollection}
     */
    readonly components: ComponentCollection;
=======
     * @type {Collection<Component>}
     */
    readonly components: Collection<Component>;
>>>>>>> Emit alslo the declaration files.
    /**
     * Dispatches the `onAdded` event to all listeners as `onAddedComponents`.
     *
     * @param {Component[]} components
     * @returns {void}
     */
    onAdded(...components: Component[]): void;
    /**
     * Dispatches the `onRemoved` event to all listeners as `onRemovedComponents`.
     *
     * @param {Component[]} components
     * @returns {void}
     */
    onRemoved(...components: Component[]): void;
    /**
     * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
     *
     * @returns {void}
     */
    onCleared(): void;
    /**
     * Dispatches the `onSorted` event to all listeners as `onSortedComponents`.
     *
     * @returns {void}
     */
    onSorted(): void;
}

import { Component, ComponentCollection } from './component';
import { Dispatcher } from './dispatcher';
import { CollectionListener } from './collection';
/**
 * The listener interface for a listener on an entity.
 */
export interface EntityListener<C extends Component = Component> {
    /**
     * Called as soon as a new component as been added to the entity.
     *
     * @param components The new added components.
     */
    onAddedComponents?(...components: C[]): void;
    /**
     * Called as soon as a component got removed from the entity.
     *
     * @param components The removed components
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
 * An entity holds an id and a list of components attached to it.
 * You can add or remove components from the entity.
 */
export declare abstract class AbstractEntity<C extends Component = Component, L extends EntityListener = EntityListener<C>> extends Dispatcher<L> implements CollectionListener<C> {
    readonly id: number | string;
    /**
     * The internal list of components.
     */
    protected _components: ComponentCollection<C>;
    /**
     * Creates an instance of Entity.
     *
     * @param id The id, you should provide by yourself. Maybe an uuid or a simple number.
     */
    constructor(id: number | string);
    /**
     * A snapshot of all components of this entity.
     */
    get components(): ComponentCollection<C>;
    /**
     * Dispatches the `onAdded` event to all listeners as `onAddedComponents`.
     *
     * @param components
     */
    onAdded(...components: C[]): void;
    /**
     * Dispatches the `onRemoved` event to all listeners as `onRemovedComponents`.
     *
     * @param components
     *
     */
    onRemoved(...components: C[]): void;
    /**
     * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
     *
     *
     */
    onCleared(): void;
    /**
     * Dispatches the `onSorted` event to all listeners as `onSortedComponents`.
     *
     *
     */
    onSorted(): void;
}

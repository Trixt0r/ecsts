import { Component } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
/**
 * A filter is used to filter a collection of entities by component types.
 *
 * Use @see {Filter#get} to obtain a filter for a list of components to observe on an engine or a collection of entities.
 * The obtained filter instance will take care of synchronizing with the source collection in an efficient way.
 * The user will always have snapshot of entities which meet the filter criterea no matter when an entity got
 * added or removed.
 *
 * @export
 * @class Filter
 */
export declare class Filter {
    source: Collection<AbstractEntity>;
    readonly types: readonly ComponentClass<Component>[];
    /**
     * The internal cache for filter instances.
     *
     * @protected
     * @static
     * @type {Filter[]}
     */
    protected static cache: Filter[];
    /**
     * The id of this filter.
     *
     * @type {number}
     */
    readonly id: number;
    /**
     * The entities which meet the filter conditions.
     *
     * @protected
     * @type {AbstractEntity[]}
     */
    protected filteredEntities: AbstractEntity[];
    /**
     * A frozen copy of the filtered entities for the public access.
     *
     * @protected
     * @type {AbstractEntity[]}
     */
    protected frozenEntities: AbstractEntity[];
    /**
     * The collection listener for syncing data.
     *
     * @protected
     * @type {CollectionListener<AbstractEntity>}
     */
    protected listener: CollectionListener<AbstractEntity>;
    /**
     * Whether this filter is currently attched to its collection as a listener or not.
     *
     * @protected
     * @type {boolean}
     */
    protected attached: boolean;
    /**
     * Creates an instance of Filter.
     *
     * @param {Collection<AbstractEntity>} source The collection of entities to filter.
     * @param {ComponentClass<Component>[]} types The components for which to filter for.
     */
    protected constructor(source: Collection<AbstractEntity>, types: readonly ComponentClass<Component>[]);
    /**
     * Performs all necessary steps to guarantee that the filter will be apply properly to the current collection.
     *
     * @returns {void}
     */
    protected setUp(): void;
    /**
     * Checks whether the given entity contains at least one component
     * whose type matches one of the defined types in this filter.
     *
     * @param {AbstractEntity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    protected filterFn(entity: AbstractEntity): boolean;
    /**
     * Updates the frozen entities.
     *
     * @returns {void}
     */
    protected updateFrozen(): void;
    /**
     * Sets up the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to perform the setup for.
     * @return {void}
     */
    protected setupComponentSync(entities: AbstractEntity[]): void;
    /**
     * Removes the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to remove the setup from.
     * @return {void}
     */
    protected removeComponentSync(entities: AbstractEntity[]): void;
    /**
     * Attaches this filter to its collection.
     *
     * @returns {void}
     */
    attach(): void;
    /**
     * Detaches this filter from its collection.
     *
     * @returns {void}
     */
    detach(): void;
    /**
     * Whether this filter is attached to its collection or not.
     *
     * @readonly
     * @type {boolean}
     */
    readonly isAttached: boolean;
    /**
     * The entities which match the criterea of this filter.
     *
     * @readonly
     * @type {AbstractEntity[]}
     */
    readonly entities: readonly AbstractEntity[];
    /**
     * Returns a filter for the given engine or collection of entities and combination of component classes.
     *
     * @param {Collection<AbstractEntity> | Engine} entitiesOrEngine
     * @param {ComponentClass<Component>[]} classes
     * @returns {Filter}
     */
    static get(entitiesOrEngine: Collection<AbstractEntity> | Engine, ...classes: ComponentClass<Component>[]): Filter;
}

import { Component } from "./component";
import { Collection, CollectionListener } from "./collection";
import { Entity } from "./entity";
import { Engine } from "./engine";
<<<<<<< HEAD
import { ComponentClass } from "./types";
=======
import { Class } from "./types";
>>>>>>> Emit alslo the declaration files.
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
    source: Collection<Entity>;
<<<<<<< HEAD
    readonly types: readonly ComponentClass<Component>[];
=======
    readonly types: readonly Class<Component>[];
>>>>>>> Emit alslo the declaration files.
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
     * @type {Entity[]}
     */
    protected filteredEntities: Entity[];
    /**
     * A frozen copy of the filtered entities for the public access.
     *
     * @protected
     * @type {Entity[]}
     */
    protected frozenEntities: Entity[];
    /**
     * The collection listener for syncing data.
     *
     * @protected
     * @type {CollectionListener<Entity>}
     */
    protected listener: CollectionListener<Entity>;
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
     * @param {Collection<Entity>} source The collection of entities to filter.
<<<<<<< HEAD
     * @param {ComponentClass<Component>[]} types The components for which to filter for.
     */
    protected constructor(source: Collection<Entity>, types: readonly ComponentClass<Component>[]);
=======
     * @param {Class<Component>[]} types The components for which to filter for.
     */
    protected constructor(source: Collection<Entity>, types: readonly Class<Component>[]);
>>>>>>> Emit alslo the declaration files.
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
     * @param {Entity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    protected filterFn(entity: Entity): boolean;
    /**
     * Updates the frozen entities.
     *
     * @returns {void}
     */
    protected updateFrozen(): void;
    /**
     * Sets up the component sync logic.
     *
     * @param {Entity[]} entities The entities to perform the setup for.
     * @return {void}
     */
    protected setupComponentSync(entities: Entity[]): void;
    /**
     * Removes the component sync logic.
     *
     * @param {Entity[]} entities The entities to remove the setup from.
     * @return {void}
     */
    protected removeComponentSync(entities: Entity[]): void;
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
     * @type {Entity[]}
     */
    readonly entities: readonly Entity[];
    /**
     * Returns a filter for the given engine or collection of entities and combination of component types.
     *
     * @param {Collection<Entity> | Engine} entitiesOrEngine
<<<<<<< HEAD
     * @param {ComponentClass<Component>[]} types
     * @returns {Filter}
     */
    static get(entitiesOrEngine: Collection<Entity> | Engine, ...types: ComponentClass<Component>[]): Filter;
=======
     * @param {Class<Component>[]} types
     * @returns {Filter}
     */
    static get(entitiesOrEngine: Collection<Entity> | Engine, ...types: Class<Component>[]): Filter;
>>>>>>> Emit alslo the declaration files.
}

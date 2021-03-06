import { Component } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
import { Dispatcher } from './dispatcher';
declare type CompType = ComponentClass<Component> | Component;
declare type EntityCollection = Collection<AbstractEntity>;
/**
 * Describes the constraints of an aspect.
 *
 * @export
 * @interface AspectDescriptor
 */
export interface AspectDescriptor {
    /**
     * Components which all have to be matched by an entity.
     *
     * @type {CompType[]}
     */
    all: CompType[];
    /**
     * Components which are not allowed to be matched by an entity.
     *
     * @type {CompType[]}
     */
    exclude: CompType[];
    /**
     * Components of which at least one has to be matched by an entity.
     *
     * @type {CompType[]}
     */
    one: CompType[];
}
/**
 * Listener which listens to various aspect events.
 *
 * @interface AspectListener
 */
export interface AspectListener {
    /**
     * Called if new entities got added to the aspect.
     *
     * @param {...AbstractEntity[]} entities
     * @returns {void}
     */
    onAddedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called if existing entities got removed from the aspect.
     *
     * @param {...AbstractEntity[]} entities
     * @returns {void}
     */
    onRemovedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called if the source entities got cleared.
     *
     * @returns {void}
     */
    onClearedEntities?(): void;
    /**
     * Called if the source entities got sorted.
     *
     * @returns {void}
     */
    onSortedEntities?(): void;
    /**
     * Gets called if new components got added to the given entity.
     *
     * @param {AbstractEntity} entity
     * @param {...Component[]} components
     * @returns {void}
     */
    onAddedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if components got removed from the given entity.
     *
     * @param {AbstractEntity} entity
     * @param {...Component[]} components
     * @returns {void}
     */
    onRemovedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if the components of the given entity got cleared.
     *
     * @param {AbstractEntity} entity
     * @returns {void}
     */
    onClearedComponents?(entity: AbstractEntity): void;
    /**
     * Gets called if the components of the given entity got sorted.
     *
     * @param {AbstractEntity} entity
     * @returns {void}
     */
    onSortedComponents?(entity: AbstractEntity): void;
    /**
     * Gets called if the aspect got attached.
     *
     * @returns {void}
     */
    onAttached?(): void;
    /**
     * Gets called if the aspect got detached.
     *
     * @returns {void}
     */
    onDetached?(): void;
}
/**
 * An aspect is used to filter a collection of entities by component types.
 *
 * Use @see {Aspect#get} to obtain an aspect for a list of components to observe on an engine or a collection of entities.
 * The obtained aspect instance will take care of synchronizing with the source collection in an efficient way.
 * The user will always have snapshot of entities which meet the aspect criteria no matter when an entity got
 * added or removed.
 *
 * @export
 * @class Aspect
 */
export declare class Aspect<L extends AspectListener = AspectListener> extends Dispatcher<L> {
    source: EntityCollection;
    /**
     * Internal index.
     */
    protected static ID: number;
    /**
     * Internal unique id.
     */
    protected readonly id: number;
    /**
     * Component types which all have to be matched by the entity source.
     *
     * @protected
     * @type {CompType[]}
     */
    protected allComponents: CompType[];
    /**
     * Component types which all are not allowed to match.
     *
     * @protected
     * @type {CompType[]}
     */
    protected excludeComponents: CompType[];
    /**
     * Component types of which at least one has to match.
     *
     * @protected
     * @type {CompType[]}
     */
    protected oneComponents: CompType[];
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
     * Whether this filter is currently attached to its collection as a listener or not.
     *
     * @protected
     * @type {boolean}
     */
    protected attached: boolean;
    /**
     * Creates an instance of an Aspect.
     *
     * @param {Collection<AbstractEntity>} source The collection of entities to filter.
     * @param {CompType[]} [all] Optional component types which should all match.
     * @param {CompType[]} [exclude] Optional component types which should not match.
     * @param {CompType[]} [one] Optional component types of which at least one should match.
     */
    protected constructor(source: EntityCollection, all?: CompType[], exclude?: CompType[], one?: CompType[]);
    /**
     * Performs the match on each entity in the source collection.
     *
     * @returns {void}
     */
    protected matchAll(): void;
    /**
     * Checks whether the given entity matches the constraints on this aspect.
     *
     * @param {AbstractEntity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    matches(entity: AbstractEntity): boolean;
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
    protected removeComponentSync(entities: Readonly<AbstractEntity[]>): void;
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
     * The entities which match the criteria of this filter.
     *
     * @readonly
     * @type {AbstractEntity[]}
     */
    readonly entities: readonly AbstractEntity[];
    /**
     * Includes all the given component types.
     *
     * Entities have to match every type.
     *
     * @param {CompType} classes
     */
    all(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#all}
     * @param {CompType} classes
     */
    every(...classes: CompType[]): this;
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param {CompType[]} classes
     */
    exclude(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#exclude}
     * @param {CompType[]} classes
     */
    without(...classes: CompType[]): this;
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param {CompType[]} classes
     */
    one(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#one}
     * @param {CompType[]} classes
     */
    some(...classes: CompType[]): this;
    /**
     * Collects information about this aspect and returns it.
     *
     * @returns {AspectDescriptor}
     */
    getDescriptor(): AspectDescriptor;
    /**
     * Returns an aspect for the given engine or collection of entities.
     *
     * @param {Collection<AbstractEntity> | Engine} collOrEngine
     * @param {CompType[]} [all] Optional component types which should all match.
     * @param {CompType[]} [exclude] Optional component types which should not match.
     * @param {CompType[]} [one] Optional component types of which at least one should match.
     * @returns {Aspect}
     */
    static for(collOrEngine: EntityCollection | Engine, all?: CompType[], exclude?: CompType[], one?: CompType[]): Aspect;
}
export {};

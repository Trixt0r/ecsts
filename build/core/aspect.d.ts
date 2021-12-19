import { Component } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity, EntityListener } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
import { Dispatcher } from './dispatcher';
/**
 * Component or component class.
 */
declare type CompType = ComponentClass<Component> | Component;
/**
 * A collection of entities.
 */
declare type EntityCollection = Collection<AbstractEntity>;
/**
 * Entity which is synced within an aspect.
 */
declare type SyncedEntity = AbstractEntity & {
    /**
     * Entity listener mapping for aspect specific caching purposes.
     */
    __ecsEntityListener: Record<number, EntityListener>;
    /**
     * The list of listeners for this entity.
     */
    _lockedListeners: EntityListener[];
};
/**
 * Describes the constraints of an aspect.
 */
export interface AspectDescriptor {
    /**
     * Components which all have to be matched by an entity.
     */
    all: CompType[];
    /**
     * Components which are not allowed to be matched by an entity.
     */
    exclude: CompType[];
    /**
     * Components of which at least one has to be matched by an entity.
     */
    one: CompType[];
}
/**
 * Listener which listens to various aspect events.
 */
export interface AspectListener {
    /**
     * Called if new entities got added to the aspect.
     *
     * @param entities
     *
     */
    onAddedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called if existing entities got removed from the aspect.
     *
     * @param entities
     *
     */
    onRemovedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called if the source entities got cleared.
     *
     *
     */
    onClearedEntities?(): void;
    /**
     * Called if the source entities got sorted.
     *
     *
     */
    onSortedEntities?(): void;
    /**
     * Gets called if new components got added to the given entity.
     *
     * @param entity
     * @param components
     *
     */
    onAddedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if components got removed from the given entity.
     *
     * @param entity
     * @param components
     *
     */
    onRemovedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if the components of the given entity got cleared.
     *
     * @param entity
     *
     */
    onClearedComponents?(entity: AbstractEntity): void;
    /**
     * Gets called if the components of the given entity got sorted.
     *
     * @param entity
     *
     */
    onSortedComponents?(entity: AbstractEntity): void;
    /**
     * Gets called if the aspect got attached.
     *
     *
     */
    onAttached?(): void;
    /**
     * Gets called if the aspect got detached.
     *
     *
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
     */
    protected allComponents: CompType[];
    /**
     * Component types which all are not allowed to match.
     */
    protected excludeComponents: CompType[];
    /**
     * Component types of which at least one has to match.
     */
    protected oneComponents: CompType[];
    /**
     * The entities which meet the filter conditions.
     */
    protected filteredEntities: SyncedEntity[];
    /**
     * A frozen copy of the filtered entities for the public access.
     */
    protected frozenEntities: AbstractEntity[];
    /**
     * The collection listener for syncing data.
     */
    protected listener: CollectionListener<AbstractEntity>;
    /**
     * Whether this filter is currently attached to its collection as a listener or not.
     */
    protected attached: boolean;
    /**
     * Creates an instance of an Aspect.
     *
     * @param source The collection of entities to filter.
     * @param all Optional component types which should all match.
     * @param exclude Optional component types which should not match.
     * @param one Optional component types of which at least one should match.
     */
    protected constructor(source: EntityCollection, all?: CompType[], exclude?: CompType[], one?: CompType[]);
    /**
     * Performs the match on each entity in the source collection.
     *
     *
     */
    protected matchAll(): void;
    /**
     * Checks whether the given entity matches the constraints on this aspect.
     *
     * @param entity The entity to check for.
     * @return Whether the given entity has at least one component which matches.
     */
    matches(entity: AbstractEntity): boolean;
    /**
     * Updates the frozen entities.
     *
     *
     */
    protected updateFrozen(): void;
    /**
     * Sets up the component sync logic.
     *
     * @param entities The entities to perform the setup for.
     * @return {void}
     */
    protected setupComponentSync(entities: SyncedEntity[]): void;
    /**
     * Removes the component sync logic.
     *
     * @param entities The entities to remove the setup from.
     * @return {void}
     */
    protected removeComponentSync(entities: Readonly<SyncedEntity[]>): void;
    /**
     * Attaches this filter to its collection.
     *
     *
     */
    attach(): void;
    /**
     * Detaches this filter from its collection.
     *
     *
     */
    detach(): void;
    /**
     * Whether this filter is attached to its collection or not.
     */
    get isAttached(): boolean;
    /**
     * The entities which match the criteria of this filter.
     */
    get entities(): readonly AbstractEntity[];
    /**
     * Includes all the given component types.
     *
     * Entities have to match every type.
     *
     * @param classes
     */
    all(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#all}
     * @param classes
     */
    every(...classes: CompType[]): this;
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param classes
     */
    exclude(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#exclude}
     * @param classes
     */
    without(...classes: CompType[]): this;
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param classes
     */
    one(...classes: CompType[]): this;
    /**
     * @alias @see {Aspect#one}
     * @param classes
     */
    some(...classes: CompType[]): this;
    /**
     * Collects information about this aspect and returns it.
     *
     *
     */
    getDescriptor(): AspectDescriptor;
    /**
     * Returns an aspect for the given engine or collection of entities.
     *
     * @param collOrEngine
     * @param all Optional component types which should all match.
     * @param exclude Optional component types which should not match.
     * @param one Optional component types of which at least one should match.
     *
     */
    static for(collOrEngine: EntityCollection | Engine, all?: CompType[], exclude?: CompType[], one?: CompType[]): Aspect;
}
export {};

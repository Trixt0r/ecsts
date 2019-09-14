import { Component } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
declare type CompClass = ComponentClass<Component>;
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
     * @type {CompClass[]}
     */
    all: CompClass[];
    /**
     * Components which are not allowed to be matched by an entity.
     *
     * @type {CompClass[]}
     */
    exclude: CompClass[];
    /**
     * Components which of which at least one has to be matched by an entity.
     *
     * @type {CompClass[]}
     */
    one: CompClass[];
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
export declare class Aspect {
    source: EntityCollection;
    /**
     * Component types which all have to be matched by the entity source.
     *
     * @protected
     * @type {CompClass[]}
     */
    protected allComponents: CompClass[];
    /**
     * Component types which all are not allowed to match.
     *
     * @protected
     * @type {CompClass[]}
     */
    protected excludeComponents: CompClass[];
    /**
     * Component types of which at least one has to match.
     *
     * @protected
     * @type {CompClass[]}
     */
    protected oneComponents: CompClass[];
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
     * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
     * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
     * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
     */
    protected constructor(source: EntityCollection, all?: CompClass[], exclude?: CompClass[], one?: CompClass[]);
    /**
     * Performs all necessary steps to guarantee that the filter will be apply properly to the current collection.
     *
     * @returns {void}
     */
    protected setUp(): void;
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
     * @param {ComponentClass<Component>} classes
     */
    all(...classes: CompClass[]): this;
    /**
     * @alias @see {Aspect#all}
     * @param {ComponentClass<Component>} classes
     */
    every(...classes: CompClass[]): this;
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param {ComponentClass<Component>} classes
     */
    exclude(...classes: CompClass[]): this;
    /**
     * @alias @see {Aspect#exclude}
     * @param {ComponentClass<Component>[]} classes
     */
    without(...classes: CompClass[]): this;
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param {ComponentClass<Component>[]} classes
     */
    one(...classes: CompClass[]): this;
    /**
     * @alias @see {Aspect#one}
     * @param {ComponentClass<Component>[]} classes
     */
    some(...classes: CompClass[]): this;
    getDescriptor(): AspectDescriptor;
    /**
     * Returns an aspect for the given engine or collection of entities.
     *
     * @param {Collection<AbstractEntity> | Engine} collOrEngine
     * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
     * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
     * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
     * @returns {Aspect}
     */
    static for(collOrEngine: EntityCollection | Engine, all?: CompClass[], exclude?: CompClass[], one?: CompClass[]): Aspect;
}
export {};

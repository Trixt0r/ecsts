import { Engine } from './engine';
/**
 * Generates a function for the given list of component types.
 *
 * The function will match any component which matches one the given types.
 *
 * @param {ComponentCollection} comps
 * @returns {(type: CompClass, index: number, array: readonly CompClass[]) => unknown}
 */
function predicateFn(comps) {
    return comp => {
        return comps.find(c => {
            const compType = c.constructor;
            if (compType.type)
                return comp.type === compType.type;
            else
                return comp === compType;
        }) !== void 0;
    };
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
export class Aspect {
    /**
     * Creates an instance of an Aspect.
     *
     * @param {Collection<AbstractEntity>} source The collection of entities to filter.
     * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
     * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
     * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
     */
    constructor(source, all, exclude, one) {
        this.source = source;
        /**
         * Whether this filter is currently attached to its collection as a listener or not.
         *
         * @protected
         * @type {boolean}
         */
        this.attached = false;
        this.filteredEntities = [];
        this.frozenEntities = [];
        this.allComponents = all ? all : [];
        this.excludeComponents = exclude ? exclude : [];
        this.oneComponents = one ? one : [];
        this.listener = {
            onAdded: (...entities) => {
                const before = this.filteredEntities.length;
                entities.forEach(entity => {
                    if (this.matches(entity))
                        this.filteredEntities.push(entity);
                });
                this.setupComponentSync(entities);
                if (this.filteredEntities.length !== before)
                    this.updateFrozen();
            },
            onRemoved: (...entities) => {
                const before = this.filteredEntities.length;
                entities.forEach(entity => {
                    const idx = this.filteredEntities.indexOf(entity);
                    if (idx >= 0)
                        this.filteredEntities.splice(idx, 1);
                });
                this.removeComponentSync(entities);
                if (this.filteredEntities.length !== before)
                    this.updateFrozen();
            },
            onCleared: () => {
                this.removeComponentSync(this.filteredEntities);
                this.filteredEntities = [];
                this.updateFrozen();
            },
            onSorted: () => {
                this.filteredEntities = this.source.filter(this.matches, this);
                this.updateFrozen();
            },
        };
        this.setUp();
    }
    /**
     * Performs all necessary steps to guarantee that the filter will be apply properly to the current collection.
     *
     * @returns {void}
     */
    setUp() {
        this.matchAll();
        this.attach();
    }
    matchAll() {
        this.filteredEntities = this.source.filter(this.matches, this);
        this.setupComponentSync(this.filteredEntities);
        this.updateFrozen();
    }
    /**
     * Checks whether the given entity matches the constraints on this aspect.
     *
     * @param {AbstractEntity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    matches(entity) {
        const comps = entity.components;
        if (comps.length === 0)
            return false;
        const testFn = predicateFn(comps);
        // First check if "all"-component types are matched
        if (this.allComponents.length > 0 && !this.allComponents.every(testFn))
            return false;
        // Then check if "exclude"-component types are NOT matched
        if (this.excludeComponents.length > 0 && this.excludeComponents.some(testFn))
            return false;
        // Lastly check if "one"-component types are matched
        if (this.oneComponents.length > 0 && !this.oneComponents.some(testFn))
            return false;
        return true;
    }
    /**
     * Updates the frozen entities.
     *
     * @returns {void}
     */
    updateFrozen() {
        this.frozenEntities = this.filteredEntities.slice();
        Object.freeze(this.frozenEntities);
    }
    /**
     * Sets up the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to perform the setup for.
     * @return {void}
     */
    setupComponentSync(entities) {
        entities.forEach(entity => {
            if (entity.__ecsEntityListener)
                return;
            const entityListener = {
                onAddedComponents: () => {
                    if (this.filteredEntities.indexOf(entity) >= 0)
                        return;
                    if (this.matches(entity)) {
                        this.filteredEntities.push(entity);
                        this.updateFrozen();
                    }
                },
                onRemovedComponents: () => {
                    if (this.filteredEntities.indexOf(entity) < 0)
                        return;
                    if (!this.matches(entity)) {
                        const idx = this.filteredEntities.indexOf(entity);
                        if (idx >= 0) {
                            this.filteredEntities.splice(idx, 1);
                            this.updateFrozen();
                        }
                    }
                },
                onClearedComponents: () => {
                    const idx = this.filteredEntities.indexOf(entity);
                    if (idx >= 0) {
                        this.filteredEntities.splice(idx, 1);
                        this.updateFrozen();
                    }
                }
            };
            entity.__ecsEntityListener = entityListener;
            entity.addListener(entityListener);
        });
    }
    /**
     * Removes the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to remove the setup from.
     * @return {void}
     */
    removeComponentSync(entities) {
        entities.forEach(entity => {
            const entityListener = entity.__ecsEntityListener;
            const locked = entity._lockedListeners;
            locked.splice(locked.indexOf(entityListener), 1);
            entity.removeListener(entityListener);
        });
    }
    /**
     * Attaches this filter to its collection.
     *
     * @returns {void}
     */
    attach() {
        if (this.attached)
            return;
        this.source.addListener(this.listener);
        this.attached = true;
    }
    /**
     * Detaches this filter from its collection.
     *
     * @returns {void}
     */
    detach() {
        if (!this.attached)
            return;
        this.source.removeListener(this.listener);
        this.attached = false;
    }
    /**
     * Whether this filter is attached to its collection or not.
     *
     * @readonly
     * @type {boolean}
     */
    get isAttached() {
        return this.attached;
    }
    /**
     * The entities which match the criteria of this filter.
     *
     * @readonly
     * @type {AbstractEntity[]}
     */
    get entities() {
        return this.frozenEntities;
    }
    /**
     * Includes all the given component types.
     *
     * Entities have to match every type.
     *
     * @param {ComponentClass<Component>} classes
     */
    all(...classes) {
        const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
        this.allComponents = unique;
        this.matchAll();
        return this;
    }
    /**
     * @alias @see {Aspect#all}
     * @param {ComponentClass<Component>} classes
     */
    every(...classes) {
        return this.all.apply(this, classes);
    }
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param {ComponentClass<Component>} classes
     */
    exclude(...classes) {
        const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
        this.excludeComponents = unique;
        this.matchAll();
        return this;
    }
    /**
     * @alias @see {Aspect#exclude}
     * @param {ComponentClass<Component>[]} classes
     */
    without(...classes) {
        return this.exclude.apply(this, classes);
    }
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param {ComponentClass<Component>[]} classes
     */
    one(...classes) {
        const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
        this.oneComponents = unique;
        this.matchAll();
        return this;
    }
    /**
     * @alias @see {Aspect#one}
     * @param {ComponentClass<Component>[]} classes
     */
    some(...classes) {
        return this.one.apply(this, classes);
    }
    getDescriptor() {
        return {
            all: this.allComponents.slice(),
            exclude: this.excludeComponents.slice(),
            one: this.oneComponents.slice(),
        };
    }
    /**
     * Returns an aspect for the given engine or collection of entities.
     *
     * @param {Collection<AbstractEntity> | Engine} collOrEngine
     * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
     * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
     * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
     * @returns {Aspect}
     */
    static for(collOrEngine, all, exclude, one) {
        const entities = collOrEngine instanceof Engine ? collOrEngine.entities : collOrEngine;
        return new Aspect(entities, all, exclude, one);
    }
}

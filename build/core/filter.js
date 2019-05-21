import { Engine } from "./engine";
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
export class Filter {
    /**
     * Creates an instance of Filter.
     *
     * @param {Collection<Entity>} source The collection of entities to filter.
     * @param {Class<Component>[]} types The components for which to filter for.
     */
    constructor(source, types) {
        this.source = source;
        this.types = types;
        /**
         * Whether this filter is currently attched to its collection as a listener or not.
         *
         * @protected
         * @type {boolean}
         */
        this.attached = false;
        this.id = Filter.cache.length;
        this.setUp();
    }
    /**
     * Performs all necessary steps to guarantee that the filter will be apply properly to the current collection.
     *
     * @returns {void}
     */
    setUp() {
        this.filteredEntities = this.source.filter(this.filterFn, this);
        this.setupComponentSync(this.filteredEntities);
        this.updateFrozen();
        this.listener = {
            onAdded: (...entities) => {
                const before = this.filteredEntities.length;
                entities.forEach(entity => {
                    if (this.filterFn(entity))
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
                this.filteredEntities = this.source.filter(this.filterFn, this);
                this.updateFrozen();
            },
        };
        this.attach();
    }
    /**
     * Checks whether the given entity contains at least one component
     * whose type matches one of the defined types in this filter.
     *
     * @param {Entity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    filterFn(entity) {
        const comps = entity.components;
        if (comps.length === 0)
            return false;
        return comps.some(comp => this.types.indexOf(Object.getPrototypeOf(comp)) >= 0);
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
     * @param {Entity[]} entities The entities to perform the setup for.
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
                    if (this.filterFn(entity)) {
                        this.filteredEntities.push(entity);
                        this.updateFrozen();
                    }
                },
                onRemovedComponents: () => {
                    if (this.filteredEntities.indexOf(entity) < 0)
                        return;
                    if (!this.filterFn(entity)) {
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
     * @param {Entity[]} entities The entities to remove the setup from.
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
     * The entities which match the criterea of this filter.
     *
     * @readonly
     * @type {Entity[]}
     */
    get entities() {
        return this.frozenEntities;
    }
    /**
     * Returns a filter for the given engine or collection of entities and combination of component types.
     *
     * @param {Collection<Entity> | Engine} entitiesOrEngine
     * @param {Class<Component>[]} types
     * @returns {Filter}
     */
    static get(entitiesOrEngine, ...types) {
        const entities = entitiesOrEngine instanceof Engine ? entitiesOrEngine.entities : entitiesOrEngine;
        const mapped = types.map(type => type.prototype).filter((value, index, self) => self.indexOf(value) === index);
        let found = Filter.cache.find(filter => {
            if (filter.types.length !== mapped.length)
                return false;
            const filtered = mapped.filter(type => filter.types.indexOf(type) >= 0);
            return filtered.length === mapped.length;
        });
        if (found && found.source !== entities)
            found = null;
        if (!found) {
            const filter = new Filter(entities, mapped);
            Filter.cache[filter.id] = filter;
            return filter;
        }
        else {
            return found;
        }
    }
}
/**
 * The internal cache for filter instances.
 *
 * @protected
 * @static
 * @type {Filter[]}
 */
Filter.cache = [];

"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var engine_1 = require("./engine");
var dispatcher_1 = require("./dispatcher");
/**
 * Generates a function for the given list of component types.
 *
 * The function will match any component which matches one of the given types.
 *
 * @param {ComponentCollection} comps
 * @returns {(type: CompType, index: number, array: readonly CompType[]) => unknown}
 */
function predicateFn(comps) {
    return function (comp) {
        var constr = comp.constructor;
        if (constr !== Object)
            return comps.find(function (c) {
                var compType = c.constructor;
                if (compType.id)
                    return compType.id === comp.id;
                else if (compType.type)
                    return comp.type === compType.type;
                else {
                    var ok = comp === compType;
                    if (ok)
                        return true;
                    if (c.id)
                        return comp.id === c.id;
                    else if (c.type)
                        return comp.type === c.type;
                    else
                        return false;
                }
            }) !== void 0;
        else
            return comps.find(function (c) {
                if (c.id)
                    return comp.id === c.id;
                else if (c.type)
                    return comp.type === c.type;
                else
                    return false;
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
var Aspect = /** @class */ (function (_super) {
    __extends(Aspect, _super);
    /**
     * Creates an instance of an Aspect.
     *
     * @param {Collection<AbstractEntity>} source The collection of entities to filter.
     * @param {CompType[]} [all] Optional component types which should all match.
     * @param {CompType[]} [exclude] Optional component types which should not match.
     * @param {CompType[]} [one] Optional component types of which at least one should match.
     */
    function Aspect(source, all, exclude, one) {
        var _this = _super.call(this) || this;
        _this.source = source;
        /**
         * Whether this filter is currently attached to its collection as a listener or not.
         *
         * @protected
         * @type {boolean}
         */
        _this.attached = false;
        _this.id = Aspect.ID++;
        _this.filteredEntities = [];
        _this.frozenEntities = [];
        _this.allComponents = all ? all : [];
        _this.excludeComponents = exclude ? exclude : [];
        _this.oneComponents = one ? one : [];
        _this.listener = {
            onAdded: function () {
                var entities = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    entities[_i] = arguments[_i];
                }
                var added = entities.filter(function (entity) {
                    if (!_this.matches(entity))
                        return false;
                    _this.filteredEntities.push(entity);
                    return true;
                });
                _this.setupComponentSync(entities);
                if (added.length === 0)
                    return;
                _this.updateFrozen();
                var args = __spread(['onAddedEntities'], added);
                _this.dispatch.apply(_this, args);
            },
            onRemoved: function () {
                var entities = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    entities[_i] = arguments[_i];
                }
                var removed = entities.filter(function (entity) {
                    var idx = _this.filteredEntities.indexOf(entity);
                    if (idx < 0)
                        return false;
                    _this.filteredEntities.splice(idx, 1);
                    return true;
                });
                _this.removeComponentSync(entities);
                if (removed.length === 0)
                    return;
                _this.updateFrozen();
                var args = __spread(['onRemovedEntities'], removed);
                _this.dispatch.apply(_this, args);
            },
            onCleared: function () {
                if (_this.filteredEntities.length === 0)
                    return;
                _this.removeComponentSync(_this.filteredEntities);
                _this.filteredEntities = [];
                _this.updateFrozen();
                _this.dispatch('onClearedEntities');
            },
            onSorted: function () {
                if (_this.filteredEntities.length === 0)
                    return;
                _this.filteredEntities = _this.source.filter(_this.matches, _this);
                _this.updateFrozen();
                _this.dispatch('onSortedEntities');
            },
        };
        _this.attach();
        return _this;
    }
    /**
     * Performs the match on each entity in the source collection.
     *
     * @returns {void}
     */
    Aspect.prototype.matchAll = function () {
        this.filteredEntities = this.source.filter(this.matches, this);
        this.setupComponentSync(this.filteredEntities);
        this.updateFrozen();
    };
    /**
     * Checks whether the given entity matches the constraints on this aspect.
     *
     * @param {AbstractEntity} entity The entity to check for.
     * @returns {boolean} Whether the given entity has at least one component which matches.
     */
    Aspect.prototype.matches = function (entity) {
        var comps = entity.components;
        var testFn = predicateFn(comps);
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
    };
    /**
     * Updates the frozen entities.
     *
     * @returns {void}
     */
    Aspect.prototype.updateFrozen = function () {
        this.frozenEntities = this.filteredEntities.slice();
        Object.freeze(this.frozenEntities);
    };
    /**
     * Sets up the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to perform the setup for.
     * @return {void}
     */
    Aspect.prototype.setupComponentSync = function (entities) {
        var _this = this;
        entities.forEach(function (entity) {
            if (!entity.__ecsEntityListener)
                entity.__ecsEntityListener = {};
            if (entity.__ecsEntityListener[_this.id])
                return;
            var update = function () {
                var idx = _this.filteredEntities.indexOf(entity);
                var matches = _this.matches(entity);
                if (idx >= 0 && !matches) {
                    _this.filteredEntities.splice(idx, 1);
                    _this.updateFrozen();
                    _this.dispatch('onRemovedEntities', entity);
                    return true;
                }
                else if (matches && idx < 0) {
                    _this.filteredEntities.push(entity);
                    _this.updateFrozen();
                    _this.dispatch('onAddedEntities', entity);
                    return true;
                }
                return false;
            };
            var entityListener = {
                onAddedComponents: function () {
                    var comps = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        comps[_i] = arguments[_i];
                    }
                    var args = __spread(['onAddedComponents', entity], comps);
                    _this.dispatch.apply(_this, args);
                    update();
                },
                onRemovedComponents: function () {
                    var comps = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        comps[_i] = arguments[_i];
                    }
                    var args = __spread(['onRemovedComponents', entity], comps);
                    _this.dispatch.apply(_this, args);
                    update();
                },
                onClearedComponents: function () {
                    if (update())
                        _this.dispatch('onClearedComponents', entity);
                },
                onSortedComponents: function () {
                    var idx = _this.filteredEntities.indexOf(entity);
                    if (idx < 0)
                        return;
                    _this.dispatch('onSortedComponents', entity);
                }
            };
            entity.__ecsEntityListener[_this.id] = entityListener;
            entity.addListener(entityListener);
        });
    };
    /**
     * Removes the component sync logic.
     *
     * @param {AbstractEntity[]} entities The entities to remove the setup from.
     * @return {void}
     */
    Aspect.prototype.removeComponentSync = function (entities) {
        var _this = this;
        entities.forEach(function (entity) {
            if (!entity.__ecsEntityListener)
                entity.__ecsEntityListener = {};
            var entityListener = entity.__ecsEntityListener[_this.id];
            if (!entityListener)
                return;
            var locked = entity._lockedListeners;
            locked.splice(locked.indexOf(entityListener), 1);
            entity.removeListener(entityListener);
        });
    };
    /**
     * Attaches this filter to its collection.
     *
     * @returns {void}
     */
    Aspect.prototype.attach = function () {
        if (this.attached)
            return;
        this.matchAll();
        this.source.addListener(this.listener);
        this.attached = true;
        this.dispatch('onAttached');
    };
    /**
     * Detaches this filter from its collection.
     *
     * @returns {void}
     */
    Aspect.prototype.detach = function () {
        if (!this.attached)
            return;
        this.source.removeListener(this.listener);
        this.removeComponentSync(this.source.elements);
        this.attached = false;
        this.dispatch('onDetached');
    };
    Object.defineProperty(Aspect.prototype, "isAttached", {
        /**
         * Whether this filter is attached to its collection or not.
         *
         * @readonly
         * @type {boolean}
         */
        get: function () {
            return this.attached;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Aspect.prototype, "entities", {
        /**
         * The entities which match the criteria of this filter.
         *
         * @readonly
         * @type {AbstractEntity[]}
         */
        get: function () {
            return this.frozenEntities;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Includes all the given component types.
     *
     * Entities have to match every type.
     *
     * @param {CompType} classes
     */
    Aspect.prototype.all = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        var unique = classes.filter(function (value, index, self) { return self.indexOf(value) === index; });
        this.allComponents = unique;
        this.matchAll();
        return this;
    };
    /**
     * @alias @see {Aspect#all}
     * @param {CompType} classes
     */
    Aspect.prototype.every = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.all.apply(this, classes);
    };
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param {CompType[]} classes
     */
    Aspect.prototype.exclude = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        var unique = classes.filter(function (value, index, self) { return self.indexOf(value) === index; });
        this.excludeComponents = unique;
        this.matchAll();
        return this;
    };
    /**
     * @alias @see {Aspect#exclude}
     * @param {CompType[]} classes
     */
    Aspect.prototype.without = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.exclude.apply(this, classes);
    };
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param {CompType[]} classes
     */
    Aspect.prototype.one = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        var unique = classes.filter(function (value, index, self) { return self.indexOf(value) === index; });
        this.oneComponents = unique;
        this.matchAll();
        return this;
    };
    /**
     * @alias @see {Aspect#one}
     * @param {CompType[]} classes
     */
    Aspect.prototype.some = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.one.apply(this, classes);
    };
    /**
     * Collects information about this aspect and returns it.
     *
     * @returns {AspectDescriptor}
     */
    Aspect.prototype.getDescriptor = function () {
        return {
            all: this.allComponents.slice(),
            exclude: this.excludeComponents.slice(),
            one: this.oneComponents.slice(),
        };
    };
    /**
     * Returns an aspect for the given engine or collection of entities.
     *
     * @param {Collection<AbstractEntity> | Engine} collOrEngine
     * @param {CompType[]} [all] Optional component types which should all match.
     * @param {CompType[]} [exclude] Optional component types which should not match.
     * @param {CompType[]} [one] Optional component types of which at least one should match.
     * @returns {Aspect}
     */
    Aspect.for = function (collOrEngine, all, exclude, one) {
        var entities = collOrEngine instanceof engine_1.Engine ? collOrEngine.entities : collOrEngine;
        return new Aspect(entities, all, exclude, one);
    };
    /**
     * Internal index.
     */
    Aspect.ID = 0;
    return Aspect;
}(dispatcher_1.Dispatcher));
exports.Aspect = Aspect;

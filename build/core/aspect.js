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
exports.Aspect = void 0;
var engine_1 = require("./engine");
var dispatcher_1 = require("./dispatcher");
function ensureEntityListenerRef(entity) {
    if (!entity.__ecsEntityListener)
        entity.__ecsEntityListener = {};
}
/**
 * Generates a function for the given list of component types.
 *
 * The function will match any component which matches one of the given types.
 *
 * @param comps
 *
 */
function predicateFn(comps) {
    return function (comp) {
        var constr = comp.constructor;
        if (constr !== Object)
            return (comps.find(function (c) {
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
            }) !== void 0);
        else
            return (comps.find(function (c) {
                if (c.id)
                    return comp.id === c.id;
                else if (c.type)
                    return comp.type === c.type;
                else
                    return false;
            }) !== void 0);
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
 */
var Aspect = /** @class */ (function (_super) {
    __extends(Aspect, _super);
    /**
     * Creates an instance of an Aspect.
     *
     * @param source The collection of entities to filter.
     * @param all Optional component types which should all match.
     * @param exclude Optional component types which should not match.
     * @param one Optional component types of which at least one should match.
     */
    function Aspect(source, all, exclude, one) {
        var _this = _super.call(this) || this;
        _this.source = source;
        /**
         * The entities which meet the filter conditions.
         */
        _this.filteredEntities = [];
        /**
         * A frozen copy of the filtered entities for the public access.
         */
        _this.frozenEntities = [];
        /**
         * Whether this filter is currently attached to its collection as a listener or not.
         */
        _this.attached = false;
        _this.id = Aspect.ID++;
        _this.allComponents = all !== null && all !== void 0 ? all : [];
        _this.excludeComponents = exclude !== null && exclude !== void 0 ? exclude : [];
        _this.oneComponents = one !== null && one !== void 0 ? one : [];
        _this.listener = {
            onAdded: function () {
                var _a;
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
                if (added.length <= 0)
                    return;
                _this.updateFrozen();
                (_a = _this).dispatch.apply(_a, __spread(['onAddedEntities'], added));
            },
            onRemoved: function () {
                var _a;
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
                (_a = _this).dispatch.apply(_a, __spread(['onRemovedEntities'], removed));
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
     *
     */
    Aspect.prototype.matchAll = function () {
        this.filteredEntities = this.source.filter(this.matches, this);
        this.setupComponentSync(this.filteredEntities);
        this.updateFrozen();
    };
    /**
     * Checks whether the given entity matches the constraints on this aspect.
     *
     * @param entity The entity to check for.
     * @return Whether the given entity has at least one component which matches.
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
     *
     */
    Aspect.prototype.updateFrozen = function () {
        this.frozenEntities = this.filteredEntities.slice();
        Object.freeze(this.frozenEntities);
    };
    /**
     * Sets up the component sync logic.
     *
     * @param entities The entities to perform the setup for.
     * @return {void}
     */
    Aspect.prototype.setupComponentSync = function (entities) {
        var _this = this;
        entities.forEach(function (entity) {
            ensureEntityListenerRef(entity);
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
                    var _a;
                    var comps = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        comps[_i] = arguments[_i];
                    }
                    (_a = _this).dispatch.apply(_a, __spread(['onAddedComponents', entity], comps));
                    update();
                },
                onRemovedComponents: function () {
                    var _a;
                    var comps = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        comps[_i] = arguments[_i];
                    }
                    (_a = _this).dispatch.apply(_a, __spread(['onRemovedComponents', entity], comps));
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
                },
            };
            entity.__ecsEntityListener[_this.id] = entityListener;
            entity.addListener(entityListener);
        });
    };
    /**
     * Removes the component sync logic.
     *
     * @param entities The entities to remove the setup from.
     * @return {void}
     */
    Aspect.prototype.removeComponentSync = function (entities) {
        var _this = this;
        entities.forEach(function (entity) {
            ensureEntityListenerRef(entity);
            var entityListener = entity.__ecsEntityListener[_this.id];
            if (!entityListener)
                return;
            var locked = entity._lockedListeners;
            locked.splice(locked.indexOf(entityListener), 1);
            entity.removeListener(entityListener);
            delete entity.__ecsEntityListener[_this.id];
        });
    };
    /**
     * Attaches this filter to its collection.
     *
     *
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
     *
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
         */
        get: function () {
            return this.attached;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Aspect.prototype, "entities", {
        /**
         * The entities which match the criteria of this filter.
         */
        get: function () {
            return this.frozenEntities;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Includes all the given component types.
     *
     * Entities have to match every type.
     *
     * @param classes
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
     * @param classes
     */
    Aspect.prototype.every = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.all.apply(this, __spread(classes));
    };
    /**
     * Excludes all of the given component types.
     *
     * Entities have to exclude all types.
     *
     * @param classes
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
     * @param classes
     */
    Aspect.prototype.without = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.exclude.apply(this, __spread(classes));
    };
    /**
     * Includes one of the given component types.
     *
     * Entities have to match only one type.
     *
     * @param classes
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
     * @param classes
     */
    Aspect.prototype.some = function () {
        var classes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classes[_i] = arguments[_i];
        }
        return this.one.apply(this, __spread(classes));
    };
    /**
     * Collects information about this aspect and returns it.
     *
     *
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
     * @param collOrEngine
     * @param all Optional component types which should all match.
     * @param exclude Optional component types which should not match.
     * @param one Optional component types of which at least one should match.
     *
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

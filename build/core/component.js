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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentCollection = void 0;
var collection_1 = require("./collection");
/**
 * A collection for components.
 * Supports accessing components by their class.
 *
 */
var ComponentCollection = /** @class */ (function (_super) {
    __extends(ComponentCollection, _super);
    function ComponentCollection(initial) {
        if (initial === void 0) { initial = []; }
        var _this = _super.call(this, initial) || this;
        /**
         * Internal map for faster component access, by class or type.
         *
         */
        _this.cache = new Map();
        /**
         * Internal state for updating the components access memory.
         *
         */
        _this.dirty = new Map();
        _this.addListener(_this, true);
        return _this;
    }
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    ComponentCollection.prototype.onAdded = function () {
        var elements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elements[_i] = arguments[_i];
        }
        this.markForCacheUpdate.apply(this, __spread(elements));
    };
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    ComponentCollection.prototype.onRemoved = function () {
        var elements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elements[_i] = arguments[_i];
        }
        this.markForCacheUpdate.apply(this, __spread(elements));
    };
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    ComponentCollection.prototype.onCleared = function () {
        this.dirty.clear();
        this.cache.clear();
    };
    /**
     * Searches for the first component matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param classOrType The class or type a component has to match.
     * @return The found component or `null`.
     */
    ComponentCollection.prototype.get = function (classOrType) {
        return this.getAll(classOrType)[0];
    };
    /**
     * Searches for the all components matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param classOrType The class or type components have to match.
     * @return A list of all components matching the given class.
     */
    ComponentCollection.prototype.getAll = function (classOrType) {
        if (this.dirty.get(classOrType))
            this.updateCache(classOrType);
        if (this.cache.has(classOrType))
            return this.cache.get(classOrType);
        this.updateCache(classOrType);
        return this.cache.get(classOrType);
    };
    /**
     * Updates the cache for the given class or type.
     *
     * @param classOrType The class or type to update the cache for.
     *
     */
    ComponentCollection.prototype.updateCache = function (classOrType) {
        var e_1, _a;
        var keys = this.cache.keys();
        var type = typeof classOrType === 'string' ? classOrType : classOrType.type;
        var filtered = this.filter(function (element) {
            var _a;
            var clazz = element.constructor;
            var typeVal = (_a = element.type) !== null && _a !== void 0 ? _a : clazz.type;
            return type && typeVal ? type === typeVal : clazz === classOrType;
        });
        if (typeof classOrType !== 'string' && classOrType.type) {
            this.cache.set(classOrType.type, filtered);
            this.dirty.delete(classOrType.type);
        }
        else if (typeof classOrType === 'string') {
            try {
                for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                    var key = keys_1_1.value;
                    if (typeof key !== 'string' && key.type === classOrType) {
                        this.cache.set(key, filtered);
                        this.dirty.delete(key);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        this.cache.set(classOrType, filtered);
        this.dirty.delete(classOrType);
    };
    /**
     * Marks the classes and types of the given elements as dirty,
     * so their cache gets updated on the next request.
     *
     * @param elements
     *
     */
    ComponentCollection.prototype.markForCacheUpdate = function () {
        var _this = this;
        var elements = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elements[_i] = arguments[_i];
        }
        var keys = this.cache.keys();
        elements.forEach(function (element) {
            var e_2, _a;
            var _b, _c;
            var clazz = element.constructor;
            var classOrType = (_c = (_b = element.type) !== null && _b !== void 0 ? _b : clazz.type) !== null && _c !== void 0 ? _c : clazz;
            if (_this.dirty.get(classOrType))
                return;
            if (typeof classOrType !== 'string' && classOrType.type)
                _this.dirty.set(classOrType.type, true);
            else if (typeof classOrType === 'string') {
                try {
                    for (var keys_2 = __values(keys), keys_2_1 = keys_2.next(); !keys_2_1.done; keys_2_1 = keys_2.next()) {
                        var key = keys_2_1.value;
                        if (typeof key !== 'string' && key.type === classOrType)
                            _this.dirty.set(key, true);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (keys_2_1 && !keys_2_1.done && (_a = keys_2.return)) _a.call(keys_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            _this.dirty.set(classOrType, true);
        });
    };
    return ComponentCollection;
}(collection_1.Collection));
exports.ComponentCollection = ComponentCollection;

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
exports.AbstractEntity = void 0;
var component_1 = require("./component");
var dispatcher_1 = require("./dispatcher");
/**
 *
 * An entity holds an id and a list of components attached to it.
 * You can add or remove components from the entity.
 */
var AbstractEntity = /** @class */ (function (_super) {
    __extends(AbstractEntity, _super);
    /**
     * Creates an instance of Entity.
     *
     * @param id The id, you should provide by yourself. Maybe an uuid or a simple number.
     */
    function AbstractEntity(id) {
        var _this = _super.call(this) || this;
        _this.id = id;
        _this._components = new component_1.ComponentCollection();
        _this._components.addListener(_this, true);
        return _this;
    }
    Object.defineProperty(AbstractEntity.prototype, "components", {
        /**
         * A snapshot of all components of this entity.
         */
        get: function () {
            return this._components;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Dispatches the `onAdded` event to all listeners as `onAddedComponents`.
     *
     * @param components
     */
    AbstractEntity.prototype.onAdded = function () {
        var _a;
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        return (_a = this).dispatch.apply(_a, __spread(['onAddedComponents'], components));
    };
    /**
     * Dispatches the `onRemoved` event to all listeners as `onRemovedComponents`.
     *
     * @param components
     *
     */
    AbstractEntity.prototype.onRemoved = function () {
        var _a;
        var components = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            components[_i] = arguments[_i];
        }
        return (_a = this).dispatch.apply(_a, __spread(['onRemovedComponents'], components));
    };
    /**
     * Dispatches the `onCleared` event to all listeners as `onClearedComponents`.
     *
     *
     */
    AbstractEntity.prototype.onCleared = function () {
        return this.dispatch('onClearedComponents');
    };
    /**
     * Dispatches the `onSorted` event to all listeners as `onSortedComponents`.
     *
     *
     */
    AbstractEntity.prototype.onSorted = function () {
        return this.dispatch('onSortedComponents');
    };
    return AbstractEntity;
}(dispatcher_1.Dispatcher));
exports.AbstractEntity = AbstractEntity;

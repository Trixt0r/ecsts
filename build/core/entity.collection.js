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
exports.EntityCollection = void 0;
var collection_1 = require("./collection");
var EntityCollection = /** @class */ (function (_super) {
    __extends(EntityCollection, _super);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function EntityCollection() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var _this = _super.apply(this, __spread(args)) || this;
        /**
         * Internal map for faster entity access, by id.
         */
        _this.cache = new Map();
        _this.addListener(_this, true);
        return _this;
    }
    /**
     * Returns the entity for the given id in this collection.
     *
     * @param id The id to search for.
     * @return The found entity or `undefined` if not found.
     */
    EntityCollection.prototype.get = function (id) {
        return this.cache.get(id);
    };
    /**
     * @inheritdoc
     */
    EntityCollection.prototype.onAdded = function () {
        var entities = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entities[_i] = arguments[_i];
        }
        for (var i = 0, l = entities.length; i < l; i++)
            this.cache.set(entities[i].id, entities[i]);
    };
    /**
     * @inheritdoc
     */
    EntityCollection.prototype.onRemoved = function () {
        var entities = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entities[_i] = arguments[_i];
        }
        for (var i = 0, l = entities.length; i < l; i++)
            this.cache.delete(entities[i].id);
    };
    /**
     * @inheritdoc
     */
    EntityCollection.prototype.onCleared = function () {
        this.cache.clear();
    };
    return EntityCollection;
}(collection_1.Collection));
exports.EntityCollection = EntityCollection;

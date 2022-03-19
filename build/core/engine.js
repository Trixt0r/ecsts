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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.Engine = exports.EngineMode = void 0;
var system_1 = require("./system");
var dispatcher_1 = require("./dispatcher");
var collection_1 = require("./collection");
var entity_collection_1 = require("./entity.collection");
/**
 * Defines how an engine executes its active systems.
 */
var EngineMode;
(function (EngineMode) {
    /**
     * Execute all systems by priority without waiting for them to resolve.
     */
    EngineMode["DEFAULT"] = "runDefault";
    /**
     * Execute all systems by priority. Successive systems
     * will wait until the current executing system resolves or rejects.
     */
    EngineMode["SUCCESSIVE"] = "runSuccessive";
    /**
     * Start all systems by priority, but run them all in parallel.
     */
    EngineMode["PARALLEL"] = "runParallel";
})(EngineMode = exports.EngineMode || (exports.EngineMode = {}));
/**
 * An engine puts entities and systems together.
 * It holds for each type a collection, which can be queried by each system.
 *
 * The @see {Engine#update} method has to be called in order to perform updates on each system in a certain order.
 * The engine takes care of updating only active systems in any point of time.
 *
 */
var Engine = /** @class */ (function (_super) {
    __extends(Engine, _super);
    /**
     * Creates an instance of Engine.
     */
    function Engine() {
        var _this = _super.call(this) || this;
        /**
         * The internal list of all systems in this engine.
         */
        _this._systems = new collection_1.Collection();
        /**
         * The frozen list of active systems which is used to iterate during the update.
         */
        _this._activeSystems = [];
        /**
         * The internal list of all entities in this engine.
         */
        _this._entities = new entity_collection_1.EntityCollection();
        _this._systems.addListener({
            onAdded: function () {
                var systems = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    systems[_i] = arguments[_i];
                }
                _this._systems.sort(function (a, b) { return a.priority - b.priority; });
                systems.forEach(function (system) {
                    system.engine = _this;
                    _this.updatedActiveSystems();
                    var systemListener = {
                        onActivated: function () { return _this.updatedActiveSystems(); },
                        onDeactivated: function () { return _this.updatedActiveSystems(); },
                        onError: function (error) { return _this.dispatch('onErrorBySystem', error, system); },
                    };
                    system.__ecsEngineListener = systemListener;
                    system.addListener(systemListener, true);
                });
                _this.dispatch.apply(_this, __spread(['onAddedSystems'], systems));
            },
            onRemoved: function () {
                var systems = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    systems[_i] = arguments[_i];
                }
                systems.forEach(function (system) {
                    system.engine = null;
                    _this.updatedActiveSystems();
                    var systemListener = system.__ecsEngineListener;
                    var locked = system._lockedListeners;
                    locked.splice(locked.indexOf(systemListener), 1);
                    system.removeListener(systemListener);
                });
                _this.dispatch.apply(_this, __spread(['onRemovedSystems'], systems));
            },
            onCleared: function () { return _this.dispatch('onClearedSystems'); },
        }, true);
        _this._entities.addListener({
            onAdded: function () {
                var entities = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    entities[_i] = arguments[_i];
                }
                return _this.dispatch.apply(_this, __spread(['onAddedEntities'], entities));
            },
            onRemoved: function () {
                var entities = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    entities[_i] = arguments[_i];
                }
                return _this.dispatch.apply(_this, __spread(['onRemovedEntities'], entities));
            },
            onCleared: function () { return _this.dispatch('onClearedEntities'); },
        }, true);
        _this.updatedActiveSystems();
        return _this;
    }
    Object.defineProperty(Engine.prototype, "entities", {
        /**
         * A snapshot of all entities in this engine.
         */
        get: function () {
            return this._entities;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "systems", {
        /**
         * A snapshot of all systems in this engine.
         */
        get: function () {
            return this._systems;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Engine.prototype, "activeSystems", {
        /**
         * A snapshot of all active systems in this engine.
         */
        get: function () {
            return this._activeSystems;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Updates the internal active system list.
     */
    Engine.prototype.updatedActiveSystems = function () {
        this._activeSystems = this.systems.filter(function (system) { return system.active; });
        Object.freeze(this._activeSystems);
    };
    /**
     * Updates all systems in this engine by the given delta value.
     *
     * @param [options]
     * @param [mode = EngineMode.DEFAULT]
     */
    Engine.prototype.run = function (options, mode) {
        if (mode === void 0) { mode = EngineMode.DEFAULT; }
        return this[mode].call(this, options);
    };
    /**
     * Updates all systems in this engine by the given delta value,
     * without waiting for a resolve or reject of each system.
     *
     * @param [options]
     */
    Engine.prototype.runDefault = function (options) {
        var length = this._activeSystems.length;
        for (var i = 0; i < length; i++)
            this._activeSystems[i].run(options, system_1.SystemMode.SYNC);
    };
    /**
     * Updates all systems in this engine by the given delta value,
     * by waiting for a system to resolve or reject before continuing with the next one.
     *
     * @param [options]
     */
    Engine.prototype.runSuccessive = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var length, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        length = this._activeSystems.length;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this._activeSystems[i].run(options, system_1.SystemMode.SYNC)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Updates all systems in this engine by the given delta value,
     * by running all systems in parallel and waiting for all systems to resolve or reject.
     *
     * @param [options]
     */
    Engine.prototype.runParallel = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var mapped;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mapped = this._activeSystems.map(function (system) { return system.run(options, system_1.SystemMode.ASYNC); });
                        return [4 /*yield*/, Promise.all(mapped)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Engine;
}(dispatcher_1.Dispatcher));
exports.Engine = Engine;

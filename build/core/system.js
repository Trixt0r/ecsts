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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractEntitySystem = exports.System = exports.SystemMode = void 0;
/* eslint-disable @typescript-eslint/no-empty-function */
var engine_1 = require("./engine");
var dispatcher_1 = require("./dispatcher");
var aspect_1 = require("./aspect");
/**
 * Defines how a system executes its task.
 *
 * @enum {number}
 */
var SystemMode;
(function (SystemMode) {
    /**
     * Do work and resolve immediately.
     */
    SystemMode["SYNC"] = "runSync";
    /**
     * Do async work. E.g. do work in a worker, make requests to another server, etc.
     */
    SystemMode["ASYNC"] = "runAsync";
})(SystemMode = exports.SystemMode || (exports.SystemMode = {}));
/**
 * A system processes a list of entities which belong to an engine.
 * Entities can only be accessed via the assigned engine. @see {Engine}.
 * The implementation of the specific system has to choose on which components of an entity to operate.
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var System = /** @class */ (function (_super) {
    __extends(System, _super);
    /**
     * Creates an instance of System.
     *
     * @param [priority=0] The priority of this system. The lower the value the earlier it will process.
     */
    function System(priority) {
        if (priority === void 0) { priority = 0; }
        var _this = _super.call(this) || this;
        _this.priority = priority;
        _this._active = true;
        _this._updating = false;
        _this._engine = null;
        return _this;
    }
    Object.defineProperty(System.prototype, "active", {
        /**
         * The active state of this system.
         * If the flag is set to `false`, this system will not be able to process.
         *
         */
        get: function () {
            return this._active;
        },
        set: function (active) {
            if (active === this._active)
                return;
            this._active = active;
            if (active) {
                this.onActivated();
            }
            else {
                this.onDeactivated();
            }
            this.dispatch(active ? 'onActivated' : 'onDeactivated');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(System.prototype, "engine", {
        /**
         * The engine this system is assigned to.
         *
         */
        get: function () {
            return this._engine;
        },
        set: function (engine) {
            if (engine === this._engine)
                return;
            var oldEngine = this._engine;
            this._engine = engine;
            if (oldEngine instanceof engine_1.Engine) {
                this.onRemovedFromEngine(oldEngine);
                this.dispatch('onRemovedFromEngine', oldEngine);
            }
            if (engine instanceof engine_1.Engine) {
                this.onAddedToEngine(engine);
                this.dispatch('onAddedToEngine', engine);
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(System.prototype, "updating", {
        /**
         * Determines whether this system is currently updating or not.
         * The value will stay `true` until @see {System#process} resolves or rejects.
         *
         * @readonly
         */
        get: function () {
            return this._updating;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Runs the system process with the given delta time.
     *
     * @param options
     * @param mode The system mode to run in.
     *
     */
    System.prototype.run = function (options, mode) {
        var _a;
        if (mode === void 0) { mode = SystemMode.SYNC; }
        return (_a = this[mode]) === null || _a === void 0 ? void 0 : _a.call(this, options);
    };
    /**
     * Processes data synchronously.
     *
     * @param options
     *
     */
    System.prototype.runSync = function (options) {
        try {
            this.process(options);
        }
        catch (e) {
            this.dispatch('onError', e);
        }
    };
    /**
     * Processes data asynchronously.
     *
     * @param options
     *
     */
    System.prototype.runAsync = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._updating = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, this.process(options)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        e_1 = _a.sent();
                        this.dispatch('onError', e_1);
                        return [3 /*break*/, 5];
                    case 4:
                        this._updating = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Called as soon as the `active` switched to `true`.
     *
     *
     */
    System.prototype.onActivated = function () {
        /* NOOP */
    };
    /**
     * Called as soon as the `active` switched to `false`.
     *
     *
     */
    System.prototype.onDeactivated = function () {
        /* NOOP */
    };
    /**
     * Called as soon as the system got removed from an engine.
     *
     * @param engine The engine this system got added to.
     *
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    System.prototype.onRemovedFromEngine = function (engine) {
        /* NOOP */
    };
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param engine The engine this system got added to.
     *
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    System.prototype.onAddedToEngine = function (engine) {
        /* NOOP */
    };
    /**
     * Called as soon an error occurred during update.
     *
     * @param error The error which occurred.
     *
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    System.prototype.onError = function (error) {
        /* NOOP */
    };
    return System;
}(dispatcher_1.Dispatcher));
exports.System = System;
/**
 * An abstract entity system is a system which processes each entity.
 *
 * Optionally it accepts component types for auto filtering the entities before processing.
 * This class abstracts away the initialization of aspects and detaches them properly, if needed.
 *
 */
var AbstractEntitySystem = /** @class */ (function (_super) {
    __extends(AbstractEntitySystem, _super);
    /**
     * Creates an instance of AbstractEntitySystem.
     *
     * @param [priority=0] The priority of this system. The lower the value the earlier it will process.
     * @param [all] Optional component types which should all match.
     * @param [exclude] Optional component types which should not match.
     * @param [one] Optional component types of which at least one should match.
     */
    function AbstractEntitySystem(priority, all, exclude, one) {
        if (priority === void 0) { priority = 0; }
        var _this = _super.call(this, priority) || this;
        _this.priority = priority;
        _this.all = all;
        _this.exclude = exclude;
        _this.one = one;
        /**
         * The optional aspect, if any.
         *
         */
        _this.aspect = null;
        return _this;
    }
    /** @inheritdoc */
    AbstractEntitySystem.prototype.onAddedToEngine = function (engine) {
        this.aspect = aspect_1.Aspect.for(engine, this.all, this.exclude, this.one);
        this.aspect.addListener(this);
    };
    /** @inheritdoc */
    AbstractEntitySystem.prototype.onRemovedFromEngine = function () {
        if (!this.aspect)
            return;
        this.aspect.removeListener(this);
        this.aspect.detach();
    };
    /**
     * Called if new entities got added to the system.
     *
     * @param entities
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onAddedEntities = function () {
        var entities = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entities[_i] = arguments[_i];
        }
    };
    /**
     * Called if existing entities got removed from the system.
     *
     * @param entities
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onRemovedEntities = function () {
        var entities = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entities[_i] = arguments[_i];
        }
    };
    /**
     * Called if the entities got cleared.
     *
     *
     */
    AbstractEntitySystem.prototype.onClearedEntities = function () { };
    /**
     * Called if the entities got sorted.
     *
     *
     */
    AbstractEntitySystem.prototype.onSortedEntities = function () { };
    /**
     * Gets called if new components got added to the given entity.
     *
     * @param entity
     * @param components
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onAddedComponents = function (entity) {
        var components = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            components[_i - 1] = arguments[_i];
        }
    };
    /**
     * Gets called if components got removed from the given entity.
     *
     * @param entity
     * @param components
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onRemovedComponents = function (entity) {
        var components = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            components[_i - 1] = arguments[_i];
        }
    };
    /**
     * Gets called if the components of the given entity got cleared.
     *
     * @param entity
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onClearedComponents = function (entity) { };
    /**
     * Gets called if the components of the given entity got sorted.
     *
     * @param entity
     *
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AbstractEntitySystem.prototype.onSortedComponents = function (entity) { };
    /** @inheritdoc */
    AbstractEntitySystem.prototype.process = function (options) {
        if (!this._engine)
            return;
        var entities = this.aspect ? this.aspect.entities : this._engine.entities.elements;
        for (var i = 0, l = entities.length; i < l; i++) {
            this.processEntity(entities[i], i, entities, options);
        }
    };
    return AbstractEntitySystem;
}(System));
exports.AbstractEntitySystem = AbstractEntitySystem;

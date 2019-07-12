var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Engine } from "./engine";
import { Dispatcher } from "./dispatcher";
/**
 * Defines how a system executes its task.
 *
 * @export
 * @enum {number}
 */
export var SystemMode;
(function (SystemMode) {
    /**
     * Do work and resolve immediately.
     */
    SystemMode["SYNC"] = "runSync";
    /**
     * Do async work. E.g. do work in a worker, make requests to another server, etc.
     */
    SystemMode["ASYNC"] = "runAsync";
})(SystemMode || (SystemMode = {}));
/**
 * A system processes a list of entities which belong to an engine.
 * Entities can only be accessed via the assigned engine. @see {Engine}.
 * The implementation of the specific system has to choose on which components of an entity to operate.
 *
 * @export
 * @abstract
 * @class System
 * @extends {Dispatcher<SystemListener>}
 */
export class System extends Dispatcher {
    /**
     * Creates an instance of System.
     *
     * @param {number} [priority=0] The priority of this engine. The lower the value the earlier it will be updated.
     */
    constructor(priority = 0) {
        super();
        this.priority = priority;
        this._active = true;
        this._updating = false;
        this._engine = null;
    }
    /**
     * The active state of this system.
     * If the flag is set to `false`, this system will not be updated.
     *
     * @type {boolean}
     */
    get active() {
        return this._active;
    }
    set active(active) {
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
    }
    /**
     * The engine this system is assigned to.
     *
     * @type {Engine | null}
     */
    get engine() {
        return this._engine;
    }
    set engine(engine) {
        if (engine === this._engine)
            return;
        const oldEngine = this._engine;
        this._engine = engine;
        if (oldEngine instanceof Engine) {
            this.onRemovedFromEngine(oldEngine);
            this.dispatch('onRemovedFromEngine', oldEngine);
        }
        if (engine instanceof Engine) {
            this.onAddedToEngine(engine);
            this.dispatch('onAddedToEngine', engine);
        }
    }
    /**
     * Determines whether this system is currenlty updating or not.
     * The value will stay `true` until @see {System#process} resolves or rejects.
     *
     * @readonly
     * @type {boolean}
     */
    get updating() {
        return this._updating;
    }
    /**
     * Runs the system process with the given delta time.
     *
     * @param {any} options
     * @param {SystemMode} [mode=SystemMode.SYNC]
     * @returns {void | Promise<void>}
     */
    run(options, mode = SystemMode.SYNC) {
        return this[mode](options);
    }
    /**
     * Processes data synchronously.
     *
     * @param {any} options
     * @returns {void}
     */
    runSync(options) {
        try {
            this.process(options);
        }
        catch (e) {
            this.dispatch('onError', e);
        }
    }
    /**
     * Processes data asynchronously.
     *
     * @param {any} options
     * @returns {void}
     */
    runAsync(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this._updating = true;
            try {
                yield this.process(options);
            }
            catch (e) {
                this.dispatch('onError', e);
            }
            finally {
                this._updating = false;
            }
        });
    }
    /**
     * Called as soon as the `active` switched to `true`.
     *
     * @returns {void}
     */
    onActivated() { }
    /**
     * Called as soon as the `active` switched to `false`.
     *
     * @returns {void}
     */
    onDeactivated() { }
    /**
     * Called as soon as the system got removed from an engine.
     *
     * @param {Engine} engine The engine this system got added to.
     *
     * @returns {void}
     */
    onRemovedFromEngine(engine) { }
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param {Engine} engine The engine this system got added to.
     *
     * @returns {void}
     */
    onAddedToEngine(engine) { }
    /**
     * Called as soon an error occurred during update.
     *
     * @param {Error} error The error which occurred.
     *
     * @returns {void}
     */
    onError(error) { }
}

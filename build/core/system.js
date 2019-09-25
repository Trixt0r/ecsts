var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Engine } from './engine';
import { Dispatcher } from './dispatcher';
import { Aspect } from './aspect';
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
 * @extends {Dispatcher<L>}
 * @template L
 */
export class System extends Dispatcher {
    /**
     * Creates an instance of System.
     *
     * @param {number} [priority=0] The priority of this system. The lower the value the earlier it will process.
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
     * If the flag is set to `false`, this system will not be able to process.
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
     * Determines whether this system is currently updating or not.
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
/**
 * An abstract entity system is a system which processes each entity.
 *
 * Optionally it accepts component types for auto filtering the entities before processing.
 * This class abstracts away the initialization of aspects and detaches them properly, if needed.
 *
 * @export
 * @abstract
 * @class AbstractEntitySystem
 * @extends {System}
 * @template T
 */
export class AbstractEntitySystem extends System {
    /**
     * Creates an instance of AbstractEntitySystem.
     *
     * @param {number} [priority=0] The priority of this system. The lower the value the earlier it will process.
     * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
     * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
     * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
     */
    constructor(priority = 0, all, exclude, one) {
        super(priority);
        this.priority = priority;
        this.all = all;
        this.exclude = exclude;
        this.one = one;
        /**
         * The optional aspect, if any.
         *
         * @protected
         * @type {(Aspect | null)}
         */
        this.aspect = null;
    }
    /** @inheritdoc */
    onAddedToEngine(engine) {
        this.aspect = Aspect.for(engine, this.all, this.exclude, this.one);
        this.aspect.addListener(this);
    }
    /** @inheritdoc */
    onRemovedFromEngine() {
        if (!this.aspect)
            return;
        this.aspect.removeListener(this);
        this.aspect.detach();
    }
    /**
     * Called if new entities got added to the system.
     *
     * @param {...AbstractEntity[]} entities
     * @returns {void}
     */
    onAddedEntities(...entities) { }
    /**
     * Called if existing entities got removed from the system.
     *
     * @param {...AbstractEntity[]} entities
     * @returns {void}
     */
    onRemovedEntities(...entities) { }
    /**
     * Called if the entities got cleared.
     *
     * @returns {void}
     */
    onClearedEntities() { }
    /**
     * Called if the entities got sorted.
     *
     * @returns {void}
     */
    onSortedEntities() { }
    /**
     * Gets called if new components got added to the given entity.
     *
     * @param {AbstractEntity} entity
     * @param {...Component[]} components
     * @returns {void}
     */
    onAddedComponents(entity, ...components) { }
    /**
     * Gets called if components got removed from the given entity.
     *
     * @param {AbstractEntity} entity
     * @param {...Component[]} components
     * @returns {void}
     */
    onRemovedComponents(entity, ...components) { }
    /**
     * Gets called if the components of the given entity got cleared.
     *
     * @param {AbstractEntity} entity
     * @returns {void}
     */
    onClearedComponents(entity) { }
    /**
     * Gets called if the components of the given entity got sorted.
     *
     * @param {AbstractEntity} entity
     * @returns {void}
     */
    onSortedComponents(entity) { }
    /** @inheritdoc */
    process(options) {
        if (!this._engine)
            return;
        const entities = this.aspect ? this.aspect.entities : this._engine.entities.elements;
        for (let i = 0, l = entities.length; i < l; i++) {
            this.processEntity(entities[i], i, entities, options);
        }
    }
}

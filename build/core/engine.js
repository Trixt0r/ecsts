var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SystemMode } from './system';
import { Dispatcher } from './dispatcher';
import { Collection } from './collection';
/**
 * Defines how an engine executes its active systems.
 *
 * @export
 * @enum {number}
 */
export var EngineMode;
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
})(EngineMode || (EngineMode = {}));
/**
 * An engine puts entities and systems together.
 * It holds for each type a collection, which can be queried by each system.
 *
 * The @see {Engine#update} method has to be called in order to perform updates on each system in a certain order.
 * The engine takes care of updating only active systems in any point of time.
 *
 * @export
 * @class Engine
 * @extends {Dispatcher<EngineListener>}
 */
export class Engine extends Dispatcher {
    /**
     * Creates an instance of Engine.
     */
    constructor() {
        super();
        this._systems = new Collection();
        this._entities = new Collection();
        this._activeSystems = [];
        this._systems.addListener({
            onAdded: (...systems) => {
                this._systems.sort((a, b) => a.priority - b.priority);
                systems.forEach(system => {
                    system.engine = this;
                    this.updatedActiveSystems();
                    const systemListener = {
                        onActivated: () => this.updatedActiveSystems(),
                        onDeactivated: () => this.updatedActiveSystems(),
                        onError: error => this.dispatch('onErrorBySystem', error, system),
                    };
                    system.__ecsEngineListener = systemListener;
                    system.addListener(systemListener, true);
                });
                this.dispatch.apply(this, ['onAddedSystems', ...systems]);
            },
            onRemoved: (...systems) => {
                systems.forEach(system => {
                    system.engine = null;
                    this.updatedActiveSystems();
                    const systemListener = system.__ecsEngineListener;
                    const locked = system._lockedListeners;
                    locked.splice(locked.indexOf(systemListener), 1);
                    system.removeListener(systemListener);
                });
                this.dispatch.apply(this, ['onRemovedSystems', ...systems]);
            },
            onCleared: () => this.dispatch('onClearedSystems'),
        }, true);
        this._entities.addListener({
            onAdded: (...entities) => {
                this.dispatch.apply(this, ['onAddedEntities', ...entities]);
            },
            onRemoved: (...entities) => {
                this.dispatch.apply(this, ['onRemovedEntities', ...entities]);
            },
            onCleared: () => this.dispatch('onClearedEntities'),
        }, true);
        this.updatedActiveSystems();
    }
    /**
     * A snapshot of all entities in this engine.
     *
     * @readonly
     * @type {Collection<AbstractEntity>}
     */
    get entities() {
        return this._entities;
    }
    /**
     * A snapshot of all systems in this engine.
     *
     * @readonly
     * @type {Collection<System>}
     */
    get systems() {
        return this._systems;
    }
    /**
     * A snapshot of all active systems in this engine.
     *
     * @readonly
     * @type {AbstractEntity[]}
     */
    get activeSystems() {
        return this._activeSystems;
    }
    /**
     * Updates the internal active system list.
     *
     * @protected
     */
    updatedActiveSystems() {
        this._activeSystems = this.systems.filter(system => system.active);
        Object.freeze(this._activeSystems);
    }
    /**
     * Updates all systems in this engine by the given delta value.
     *
     * @param {any} [options]
     * @param {EngineMode} [mode = EngineMode.DEFAULT]
     * @returns {void | Promise<void>}
     */
    run(options, mode = EngineMode.DEFAULT) {
        return this[mode](options);
    }
    /**
     * Updates all systems in this engine by the given delta value,
     * without waiting for a resolve or reject of each system.
     *
     * @param {any} [options]
     * @returns {void}
     */
    runDefault(options) {
        const length = this._activeSystems.length;
        for (let i = 0; i < length; i++)
            this._activeSystems[i].run(options, SystemMode.SYNC);
    }
    /**
     * Updates all systems in this engine by the given delta value,
     * by waiting for a system to resolve or reject before continuing with the next one.
     *
     * @param {any} [options]
     * @returns {Promise<void>}
     */
    runSuccessive(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const length = this._activeSystems.length;
            for (let i = 0; i < length; i++)
                yield this._activeSystems[i].run(options, SystemMode.SYNC);
        });
    }
    /**
     * Updates all systems in this engine by the given delta value,
     * by running all systems in parallel and waiting for all systems to resolve or reject.
     *
     * @param {any} [options]
     * @returns {Promise<void>}
     */
    runParallel(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const mapped = this._activeSystems.map(system => system.run(options, SystemMode.ASYNC));
            yield Promise.all(mapped);
        });
    }
}

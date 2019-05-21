var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Dispatcher } from "./dispatcher";
import { Collection } from "./collection";
import { Filter } from "./filter";
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
        this._entites = new Collection();
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
                const args = ['onAddedSystems'].concat(systems);
                this.dispatch.apply(this, args);
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
                const args = ['onRemovedSystems'].concat(systems);
                this.dispatch.apply(this, args);
            },
            onCleared: () => this.dispatch('onClearedSystems'),
        }, true);
        this._entites.addListener({
            onAdded: (...entities) => {
                const args = ['onAddedEntities'].concat(entities);
                this.dispatch.apply(this, args);
            },
            onRemoved: (...entities) => {
                const args = ['onRemovedEntities'].concat(entities);
                this.dispatch.apply(this, args);
            },
            onCleared: () => this.dispatch('onClearedEntities'),
        }, true);
        this.updatedActiveSystems();
    }
    /**
     * A snapshot of all entities in this engine.
     *
     * @readonly
     * @type {Collection<Entity>}
     */
    get entities() {
        return this._entites;
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
     * @type {Entity[]}
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
     * @param {number} delta
     * @returns {Promise<void>}
     */
    update(delta) {
        return __awaiter(this, void 0, void 0, function* () {
            const length = this._activeSystems.length;
            for (let i = 0; i < length; i++)
                yield this._activeSystems[i].update(delta);
        });
    }
    /**
     * Returns a filter for the given types of components.
     *
     * @param {Class<Component>[]} types The types of components the entities have to match.
     * @returns {Filter}
     */
    getFilter(...types) {
        const args = [this].concat(types);
        return Filter.get.apply(Filter, args);
    }
}

import { System } from './system';
import { AbstractEntity } from './entity';
import { Dispatcher } from './dispatcher';
import { Collection } from './collection';
/**
 * The listener interface for a listener on an engine.
 *
 * @export
 * @interface EntityListener
 */
export interface EngineListener {
    /**
     * Called as soon as the given system gets added to the engine.
     *
     * @param {System[]} systems
     */
    onAddedSystems?(...systems: System[]): void;
    /**
     * Called as soon as the given system gets removed from the engine.
     *
     * @param {System[]} systems
     */
    onRemovedSystems?(...systems: System[]): void;
    /**
     * Called as soon as all systems got cleared from the engine.
     */
    onClearedSystems(): void;
    /**
     * Called as soon as an error occurred on in an active system during update.
     *
     * @param {Error} error The error that occurred.
     * @param {System} system The system on which the error occurred.
     */
    onErrorBySystem(error: Error, system: System): void;
    /**
     * Called as soon as the given entity gets added to the engine.
     *
     * @param {AbstractEntity[]} entities
     */
    onAddedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called as soon as the given entity gets removed from the engine.
     *
     * @param {AbstractEntity[]} entities
     */
    onRemovedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called as soon as all entities got cleared from the engine.
     */
    onClearedEntities(): void;
}
/**
 * Defines how an engine executes its active systems.
 *
 * @export
 * @enum {number}
 */
export declare enum EngineMode {
    /**
     * Execute all systems by priority without waiting for them to resolve.
     */
    DEFAULT = "runDefault",
    /**
     * Execute all systems by priority. Successive systems
     * will wait until the current executing system resolves or rejects.
     */
    SUCCESSIVE = "runSuccessive",
    /**
     * Start all systems by priority, but run them all in parallel.
     */
    PARALLEL = "runParallel"
}
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
export declare class Engine extends Dispatcher<EngineListener> {
    /**
     * The internal list of all systems in this engine.
     *
     * @protected
     * @type {Collection<System>}
     */
    protected _systems: Collection<System>;
    /**
     * The frozen list of active systems which is used to iterate during the update.
     *
     * @protected
     * @type {System[]}
     */
    protected _activeSystems: System[];
    /**
     * The internal list of all entities in this engine.
     *
     * @protected
     * @type {Collection<AbstractEntity>}
     */
    protected _entities: Collection<AbstractEntity>;
    /**
     * Creates an instance of Engine.
     */
    constructor();
    /**
     * A snapshot of all entities in this engine.
     *
     * @readonly
     * @type {Collection<AbstractEntity>}
     */
    readonly entities: Collection<AbstractEntity>;
    /**
     * A snapshot of all systems in this engine.
     *
     * @readonly
     * @type {Collection<System>}
     */
    readonly systems: Collection<System>;
    /**
     * A snapshot of all active systems in this engine.
     *
     * @readonly
     * @type {AbstractEntity[]}
     */
    readonly activeSystems: readonly System[];
    /**
     * Updates the internal active system list.
     *
     * @protected
     */
    protected updatedActiveSystems(): void;
    /**
     * Updates all systems in this engine by the given delta value.
     *
     * @param {any} [options]
     * @param {EngineMode} [mode = EngineMode.DEFAULT]
     * @returns {void | Promise<void>}
     */
    run(options?: any, mode?: EngineMode): void | Promise<void>;
    /**
     * Updates all systems in this engine by the given delta value,
     * without waiting for a resolve or reject of each system.
     *
     * @param {any} [options]
     * @returns {void}
     */
    protected runDefault(options?: any): void;
    /**
     * Updates all systems in this engine by the given delta value,
     * by waiting for a system to resolve or reject before continuing with the next one.
     *
     * @param {any} [options]
     * @returns {Promise<void>}
     */
    protected runSuccessive(options?: any): Promise<void>;
    /**
     * Updates all systems in this engine by the given delta value,
     * by running all systems in parallel and waiting for all systems to resolve or reject.
     *
     * @param {any} [options]
     * @returns {Promise<void>}
     */
    protected runParallel(options?: any): Promise<void>;
}

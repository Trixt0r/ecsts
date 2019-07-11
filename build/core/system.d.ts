import { Engine } from "./engine";
import { Dispatcher } from "./dispatcher";
/**
 * The listener interface for a listener added to a system.
 *
 * @export
 * @interface SystemListener
 */
export interface SystemListener {
    /**
     * Called as soon as the `active` switched to `true`.
     */
    onActivated?(): void;
    /**
     * Called as soon as the `active` switched to `false`.
     */
    onDeactivated?(): void;
    /**
     * Called as soon as the system got removed from an engine.
     *
     * @param {Engine} engine The engine this system got added to.
     */
    onRemovedFromEngine?(engine: Engine): void;
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param {Engine} engine The engine this system got added to.
     */
    onAddedToEngine?(engine: Engine): void;
    /**
     * Called as soon an error occurred during update.
     *
     * @param {Error} error The error which occurred.
     */
    onError?(error: Error): void;
}
/**
 * Defines how a system executes its task.
 *
 * @export
 * @enum {number}
 */
export declare enum SystemMode {
    /**
     * Do work and resolve immediately.
     */
    SYNC = "runSync",
    /**
     * Do async work. E.g. do work in a worker, make requests to another server, etc.
     */
    ASYNC = "runAsync"
}
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
export declare abstract class System extends Dispatcher<SystemListener> {
    priority: number;
    /**
     * Determines whether this system is active or not.
     *
     * @protected
     * @type {boolean}
     */
    protected _active: boolean;
    /**
     * Determines whether this system is currently updating or not.
     *
     * @protected
     * @type {boolean}
     */
    protected _updating: boolean;
    /**
     * The reference to the current engine.
     *
     * @protected
     * @type {Engine}
     * @memberof System
     */
    protected _engine: Engine;
    /**
     * Creates an instance of System.
     *
     * @param {number} [priority=0] The priority of this engine. The lower the value the earlier it will be updated.
     */
    constructor(priority?: number);
    /**
     * The active state of this system.
     * If the flag is set to `false`, this system will not be updated.
     *
     * @type {boolean}
     */
    active: boolean;
    /**
     * The engine this system is assigned to.
     * This may be `null`.
     *
     * @type {Engine}
     */
    engine: Engine;
    /**
     * Determines whether this system is currenlty updating or not.
     * The value will stay `true` until @see {System#process} resolves or rejects.
     *
     * @readonly
     * @type {boolean}
     */
    readonly updating: boolean;
    /**
     * Runs the system process with the given delta time.
     *
     * @param {any} options
     * @param {SystemMode} [mode=SystemMode.SYNC]
     * @returns {void | Promise<void>}
     */
    run(options: any, mode?: SystemMode): void | Promise<void>;
    /**
     * Processes data synchronously.
     *
     * @param {any} options
     * @returns {void}
     */
    protected runSync(options: any): void;
    /**
     * Processes data asynchronously.
     *
     * @param {any} options
     * @returns {void}
     */
    protected runAsync(options: any): Promise<void>;
    /**
     * Processes the entities of the current engine.
     * To be implemented by any concrete system.
     *
     * @abstract
     * @param {any} options
     * @returns {void | Promise<void>}
     */
    abstract process(options: any): void | Promise<void>;
    /**
     * Called as soon as the `active` switched to `true`.
     *
     * @returns {void}
     */
    onActivated(): void;
    /**
     * Called as soon as the `active` switched to `false`.
     *
     * @returns {void}
     */
    onDeactivated(): void;
    /**
     * Called as soon as the system got removed from an engine.
     *
     * @param {Engine} engine The engine this system got added to.
     *
     * @returns {void}
     */
    onRemovedFromEngine(engine: Engine): void;
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param {Engine} engine The engine this system got added to.
     *
     * @returns {void}
     */
    onAddedToEngine(engine: Engine): void;
    /**
     * Called as soon an error occurred during update.
     *
     * @param {Error} error The error which occurred.
     *
     * @returns {void}
     */
    onError(error: Error): void;
}

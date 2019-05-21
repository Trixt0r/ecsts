import { System } from "./system";
import { Entity } from "./entity";
import { Dispatcher } from "./dispatcher";
import { Collection } from "./collection";
import { Filter } from "./filter";
import { Class } from "./types";
import { Component } from "./component";
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
     * @param {Entity[]} entities
     */
    onAddedEntities?(...entities: Entity[]): void;
    /**
     * Called as soon as the given entity gets removed from the engine.
     *
     * @param {Entity[]} entities
     */
    onRemovedEntities?(...entities: Entity[]): void;
    /**
     * Called as soon as all entities got cleared from the engine.
     */
    onClearedEntities(): void;
}
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
     * @type {Collection<Entity>}
     */
    protected _entites: Collection<Entity>;
    /**
     * Creates an instance of Engine.
     */
    constructor();
    /**
     * A snapshot of all entities in this engine.
     *
     * @readonly
     * @type {Collection<Entity>}
     */
    readonly entities: Collection<Entity>;
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
     * @type {Entity[]}
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
     * @param {number} delta
     * @returns {Promise<void>}
     */
    update(delta: number): Promise<void>;
    /**
     * Returns a filter for the given types of components.
     *
     * @param {Class<Component>[]} types The types of components the entities have to match.
     * @returns {Filter}
     */
    getFilter(...types: Class<Component>[]): Filter;
}

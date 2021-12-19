import { Engine } from './engine';
import { Dispatcher } from './dispatcher';
import { AbstractEntity } from './entity';
import { ComponentClass } from './types';
import { Component } from './component';
import { Aspect, AspectListener } from './aspect';
/**
 * The listener interface for a listener added to a system.
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
     * @param engine The engine this system got added to.
     */
    onRemovedFromEngine?(engine: Engine): void;
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param engine The engine this system got added to.
     */
    onAddedToEngine?(engine: Engine): void;
    /**
     * Called as soon an error occurred during update.
     *
     * @param error The error which occurred.
     */
    onError?(error: Error): void;
}
/**
 * Defines how a system executes its task.
 *
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
 */
export declare abstract class System<L extends SystemListener = SystemListener, T = any> extends Dispatcher<L> {
    priority: number;
    /**
     * Determines whether this system is active or not.
     *
     */
    protected _active: boolean;
    /**
     * Determines whether this system is currently updating or not.
     *
     */
    protected _updating: boolean;
    /**
     * The reference to the current engine.
     *
     * @memberof System
     */
    protected _engine: Engine | null;
    /**
     * Creates an instance of System.
     *
     * @param [priority=0] The priority of this system. The lower the value the earlier it will process.
     */
    constructor(priority?: number);
    /**
     * The active state of this system.
     * If the flag is set to `false`, this system will not be able to process.
     *
     */
    get active(): boolean;
    set active(active: boolean);
    /**
     * The engine this system is assigned to.
     *
     */
    get engine(): Engine | null;
    set engine(engine: Engine | null);
    /**
     * Determines whether this system is currently updating or not.
     * The value will stay `true` until @see {System#process} resolves or rejects.
     *
     * @readonly
     */
    get updating(): boolean;
    /**
     * Runs the system process with the given delta time.
     *
     * @param options
     * @param mode The system mode to run in.
     *
     */
    run(options: T, mode?: SystemMode): void | Promise<void>;
    /**
     * Processes data synchronously.
     *
     * @param options
     *
     */
    protected runSync(options: T): void;
    /**
     * Processes data asynchronously.
     *
     * @param options
     *
     */
    protected runAsync(options: T): Promise<void>;
    /**
     * Processes the entities of the current engine.
     * To be implemented by any concrete system.
     *
     * @param options
     *
     */
    abstract process(options: T): void | Promise<void>;
    /**
     * Called as soon as the `active` switched to `true`.
     *
     *
     */
    onActivated(): void;
    /**
     * Called as soon as the `active` switched to `false`.
     *
     *
     */
    onDeactivated(): void;
    /**
     * Called as soon as the system got removed from an engine.
     *
     * @param engine The engine this system got added to.
     *
     *
     */
    onRemovedFromEngine(engine: Engine): void;
    /**
     * Called as soon as the system got added to an engine.
     * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
     *
     * @param engine The engine this system got added to.
     *
     *
     */
    onAddedToEngine(engine: Engine): void;
    /**
     * Called as soon an error occurred during update.
     *
     * @param error The error which occurred.
     *
     *
     */
    onError(error: Error): void;
}
/**
 * An abstract entity system is a system which processes each entity.
 *
 * Optionally it accepts component types for auto filtering the entities before processing.
 * This class abstracts away the initialization of aspects and detaches them properly, if needed.
 *
 */
export declare abstract class AbstractEntitySystem<T extends AbstractEntity = AbstractEntity> extends System implements AspectListener {
    priority: number;
    protected all?: (Component | ComponentClass<Component>)[] | undefined;
    protected exclude?: (Component | ComponentClass<Component>)[] | undefined;
    protected one?: (Component | ComponentClass<Component>)[] | undefined;
    /**
     * The optional aspect, if any.
     *
     */
    protected aspect: Aspect | null;
    /**
     * Creates an instance of AbstractEntitySystem.
     *
     * @param [priority=0] The priority of this system. The lower the value the earlier it will process.
     * @param [all] Optional component types which should all match.
     * @param [exclude] Optional component types which should not match.
     * @param [one] Optional component types of which at least one should match.
     */
    constructor(priority?: number, all?: (Component | ComponentClass<Component>)[] | undefined, exclude?: (Component | ComponentClass<Component>)[] | undefined, one?: (Component | ComponentClass<Component>)[] | undefined);
    /** @inheritdoc */
    onAddedToEngine(engine: Engine): void;
    /** @inheritdoc */
    onRemovedFromEngine(): void;
    /**
     * Called if new entities got added to the system.
     *
     * @param entities
     *
     */
    onAddedEntities(...entities: AbstractEntity[]): void;
    /**
     * Called if existing entities got removed from the system.
     *
     * @param entities
     *
     */
    onRemovedEntities?(...entities: AbstractEntity[]): void;
    /**
     * Called if the entities got cleared.
     *
     *
     */
    onClearedEntities?(): void;
    /**
     * Called if the entities got sorted.
     *
     *
     */
    onSortedEntities?(): void;
    /**
     * Gets called if new components got added to the given entity.
     *
     * @param entity
     * @param components
     *
     */
    onAddedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if components got removed from the given entity.
     *
     * @param entity
     * @param components
     *
     */
    onRemovedComponents?(entity: AbstractEntity, ...components: Component[]): void;
    /**
     * Gets called if the components of the given entity got cleared.
     *
     * @param entity
     *
     */
    onClearedComponents?(entity: AbstractEntity): void;
    /**
     * Gets called if the components of the given entity got sorted.
     *
     * @param entity
     *
     */
    onSortedComponents?(entity: AbstractEntity): void;
    /** @inheritdoc */
    process<U>(options?: U): void;
    /**
     * Processes the given entity.
     *
     * @param entity
     * @param index
     * @param entities
     * @param options
     *
     */
    abstract processEntity<U>(entity: T, index?: number, entities?: T[], options?: U): void;
}

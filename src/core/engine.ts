import { System, SystemListener, SystemMode } from "./system";
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

/**
 * Defines how an engine executes its active systems.
 *
 * @export
 * @enum {number}
 */
export enum EngineMode {
  /**
   * Execute all systems by priority without waiting for them to resolve.
   */
  DEFAULT = 'runDefault',

  /**
   * Execute all systems by priority. Successive systems
   * will wait until the current executing system resolves or rejects.
   */
  SUCCESSIVE = 'runSuccessive',

  /**
   * Start all systems by priority, but run them all in parallel.
   */
  PARALLEL = 'runParallel',
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
export class Engine extends Dispatcher<EngineListener> {

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
  constructor() {
    super();
    this._systems = new Collection<System>();
    this._entites = new Collection<Entity>();
    this._systems.addListener({
      onAdded: (...systems: System[]) => {
        this._systems.sort((a, b) => a.priority - b.priority);
        systems.forEach(system => {
          system.engine = this;
          this.updatedActiveSystems();

          const systemListener: SystemListener = {
            onActivated: () => this.updatedActiveSystems(),
            onDeactivated: () => this.updatedActiveSystems(),
            onError: error => this.dispatch('onErrorBySystem', error, system),
          };
          (<any>system).__ecsEngineListener = systemListener;
          system.addListener(systemListener, true);
        });
      const args = ['onAddedSystems'].concat(<any[]>systems);
      this.dispatch.apply(this, args);
      },
      onRemoved: (...systems: System[]) => {
        systems.forEach(system => {
          system.engine = null;
          this.updatedActiveSystems();
          const systemListener: SystemListener = (<any>system).__ecsEngineListener;
          const locked: SystemListener[] = (<any>system)._lockedListeners;
          locked.splice(locked.indexOf(systemListener), 1);
          system.removeListener(systemListener);
        });
        const args = ['onRemovedSystems'].concat(<any[]>systems);
        this.dispatch.apply(this, args);
      },
      onCleared: () => this.dispatch('onClearedSystems'),
    }, true);

    this._entites.addListener({
      onAdded: (...entities: Entity[]) => {
        const args = ['onAddedEntities'].concat(<any[]>entities);
        this.dispatch.apply(this, args);
      },
      onRemoved: (...entities: Entity[]) => {
        const args = ['onRemovedEntities'].concat(<any[]>entities);
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
  get entities(): Collection<Entity> {
    return this._entites;
  }

  /**
   * A snapshot of all systems in this engine.
   *
   * @readonly
   * @type {Collection<System>}
   */
  get systems(): Collection<System> {
    return this._systems;
  }

  /**
   * A snapshot of all active systems in this engine.
   *
   * @readonly
   * @type {Entity[]}
   */
  get activeSystems(): readonly System[] {
    return this._activeSystems;
  }

  /**
   * Updates the internal active system list.
   *
   * @protected
   */
  protected updatedActiveSystems(): void {
    this._activeSystems = this.systems.filter(system => system.active);
    Object.freeze(this._activeSystems);
  }

  /**
   * Updates all systems in this engine by the given delta value.
   *
   * @param {number} delta
   * @param {EngineMode} mode
   * @returns {void | Promise<void>}
   */
  run(delta: number, mode: EngineMode = EngineMode.DEFAULT): void | Promise<void> {
    return this[mode](delta);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * without waiting for a resolve or reject of each system.
   *
   * @param {number} delta
   * @returns {void}
   */
  protected runDefault(delta: number): void {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++)
      this._activeSystems[i].run(delta, SystemMode.SYNC);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * by waiting for a system to resolve or reject before continuing with the next one.
   *
   * @param {number} delta
   * @returns {Promise<void>}
   */
  protected async runSuccessive(delta: number): Promise<void> {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++)
      await this._activeSystems[i].run(delta, SystemMode.SYNC);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * by running all systems in parallel and waiting for all systems to resolve or reject.
   *
   * @param {number} delta
   * @returns {Promise<void>}
   */
  protected async runParallel(delta: number): Promise<void> {
    const mapped = this._activeSystems.map(system => system.run(delta, SystemMode.ASYNC));
    await Promise.all(mapped);
  }

  /**
   * Returns a filter for the given types of components.
   *
   * @param {Class<Component>[]} types The types of components the entities have to match.
   * @returns {Filter}
   */
  getFilter(...types: Class<Component>[]): Filter {
    const args = [this].concat(<any>types);
    return Filter.get.apply(Filter, args);
  }

}

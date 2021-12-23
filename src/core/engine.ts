import { System, SystemListener, SystemMode } from './system';
import { AbstractEntity } from './entity';
import { Dispatcher } from './dispatcher';
import { Collection } from './collection';

/**
 * System which is synced within an engine.
 */
type SyncedSystem = System & {
  /**
   * System listener mapping for engine specific caching purposes.
   */
  __ecsEngineListener: SystemListener;

  /**
   * The list of listeners for this system.
   */
  _lockedListeners: SystemListener[];
};

/**
 * The listener interface for a listener on an engine.
 */
export interface EngineListener {
  /**
   * Called as soon as the given system gets added to the engine.
   *
   * @param systems
   */
  onAddedSystems?(...systems: System[]): void;

  /**
   * Called as soon as the given system gets removed from the engine.
   *
   * @param systems
   */
  onRemovedSystems?(...systems: System[]): void;

  /**
   * Called as soon as all systems got cleared from the engine.
   */
  onClearedSystems?(): void;

  /**
   * Called as soon as an error occurred on in an active system during update.
   *
   * @param error The error that occurred.
   * @param system The system on which the error occurred.
   */
  onErrorBySystem?(error: Error, system: System): void;

  /**
   * Called as soon as the given entity gets added to the engine.
   *
   * @param entities
   */
  onAddedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called as soon as the given entity gets removed from the engine.
   *
   * @param entities
   */
  onRemovedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called as soon as all entities got cleared from the engine.
   */
  onClearedEntities?(): void;
}

/**
 * Defines how an engine executes its active systems.
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
 */
export class Engine extends Dispatcher<EngineListener> {
  /**
   * The internal list of all systems in this engine.
   */
  protected _systems = new Collection<System>();

  /**
   * The frozen list of active systems which is used to iterate during the update.
   */
  protected _activeSystems: System[] = [];

  /**
   * The internal list of all entities in this engine.
   */
  protected _entities = new Collection<AbstractEntity>();

  /**
   * Creates an instance of Engine.
   */
  constructor() {
    super();
    this._systems.addListener(
      {
        onAdded: (...systems: SyncedSystem[]) => {
          this._systems.sort((a, b) => a.priority - b.priority);
          systems.forEach(system => {
            system.engine = this;
            this.updatedActiveSystems();

            const systemListener: SystemListener = {
              onActivated: () => this.updatedActiveSystems(),
              onDeactivated: () => this.updatedActiveSystems(),
              onError: error => this.dispatch('onErrorBySystem', error, system),
            };
            system.__ecsEngineListener = systemListener;
            system.addListener(systemListener, true);
          });
          this.dispatch('onAddedSystems', ...systems);
        },
        onRemoved: (...systems: SyncedSystem[]) => {
          systems.forEach(system => {
            system.engine = null;
            this.updatedActiveSystems();
            const systemListener = system.__ecsEngineListener;
            const locked = system._lockedListeners;
            locked.splice(locked.indexOf(systemListener), 1);
            system.removeListener(systemListener);
          });
          this.dispatch('onRemovedSystems', ...systems);
        },
        onCleared: () => this.dispatch('onClearedSystems'),
      },
      true
    );

    this._entities.addListener(
      {
        onAdded: (...entities: AbstractEntity[]) => this.dispatch('onAddedEntities', ...entities),
        onRemoved: (...entities: AbstractEntity[]) => this.dispatch('onRemovedEntities', ...entities),
        onCleared: () => this.dispatch('onClearedEntities'),
      },
      true
    );

    this.updatedActiveSystems();
  }

  /**
   * A snapshot of all entities in this engine.
   */
  get entities(): Collection<AbstractEntity> {
    return this._entities;
  }

  /**
   * A snapshot of all systems in this engine.
   */
  get systems(): Collection<System> {
    return this._systems;
  }

  /**
   * A snapshot of all active systems in this engine.
   */
  get activeSystems(): readonly System[] {
    return this._activeSystems;
  }

  /**
   * Updates the internal active system list.
   */
  protected updatedActiveSystems(): void {
    this._activeSystems = this.systems.filter(system => system.active);
    Object.freeze(this._activeSystems);
  }

  /**
   * Updates all systems in this engine by the given delta value.
   *
   * @param [options]
   * @param [mode = EngineMode.DEFAULT]
   */
  run<T>(options?: T, mode: EngineMode = EngineMode.DEFAULT): void | Promise<void> {
    return this[mode].call(this, options);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * without waiting for a resolve or reject of each system.
   *
   * @param [options]
   */
  protected runDefault<T>(options?: T): void {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++) this._activeSystems[i].run(options, SystemMode.SYNC);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * by waiting for a system to resolve or reject before continuing with the next one.
   *
   * @param [options]
   */
  protected async runSuccessive<T>(options?: T): Promise<void> {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++) await this._activeSystems[i].run(options, SystemMode.SYNC);
  }

  /**
   * Updates all systems in this engine by the given delta value,
   * by running all systems in parallel and waiting for all systems to resolve or reject.
   *
   * @param [options]
   */
  protected async runParallel<T>(options?: T): Promise<void> {
    const mapped = this._activeSystems.map(system => system.run(options, SystemMode.ASYNC));
    await Promise.all(mapped);
  }
}

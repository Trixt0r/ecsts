import { System, SystemListener } from "./system";
import { Entity } from "./entity";
import { Dispatcher } from "./dispatcher";
import { Collection } from "./collection";
import { Filter } from "./filter";

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

  protected entityCache: { [key: string]: { filter: (entity: Entity, idx?: number) => boolean, entities: Entity[] } } = { };

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
          (<any>system).__ecs_engine_listener = systemListener;
          system.addListener(systemListener, true);
        });
      const args = ['onAddedSystems'].concat(<any[]>systems);
      this.dispatch.apply(this, args);
      },
      onRemoved: (...systems: System[]) => {
        systems.forEach(system => {
          system.engine = null;
          this.updatedActiveSystems();
          const systemListener: SystemListener = (<any>system).__ecs_engine_listener;
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
        const cache = this.entityCache;
        const keys = Object.keys(cache);
        // On the next update the filter will be also applied for the new entity
        keys.forEach(key => {
          entities.forEach(entity => {
            const re = cache[key].filter(entity);
            if (re) cache[key].entities.push(entity);
          });
        });
        const args = ['onAddedEntities'].concat(<any[]>entities);
        this.dispatch.apply(this, args);
      },
      onRemoved: (...entities: Entity[]) => {
        const cache = this.entityCache;
        const keys = Object.keys(cache);
        // On the next update the entity won't be part of filtered system updates
        keys.forEach(key => {
          entities.forEach(entity => {
            const idx = cache[key].entities.indexOf(entity);
            if (idx >= 0) cache[key].entities.splice(idx, 1);
          });
        });
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
   * @returns {Promise<void>}
   */
  async update(delta: number): Promise<void> {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++)
      await this._activeSystems[i].update(delta);
  }

  /**
   * Returns a list of entities for the given filter.
   *
   * @param {Filter} filter The filter to apply to the current entities.
   * @returns {Entity[]}
   */
  getEntitiesFor(filter: Filter): Entity[] {
    const found = this.entityCache[filter.id];
    if (!found) {
      const types = filter.types;
      const filterFn = entity => {
        const comps = entity.components;
        return comps.some(comp => types.indexOf(Object.getPrototypeOf(comp)) >= 0);
      };
      const entities = this.entities.filter(filterFn);
      this.entityCache[filter.id] = {
        filter: filterFn,
        entities: entities
      };
      return entities;
    } else {
      return found.entities;
    }
  }

}

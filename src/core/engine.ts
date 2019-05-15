import { System } from "./system";
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
   * @param {System} system
   */
  onAddedSystem?(system: System): void;

  /**
   * Called as soon as the given system gets removed from the engine.
   *
   * @param {System} system
   */
  onRemovedSystem?(system: System): void;

  /**
   * Called as soon as all systems got cleared from the engine.
   */
  onClearedSystems(): void;

  /**
   * Called as soon as the given entity gets added to the engine.
   *
   * @param {Entity} entity
   */
  onAddedEntity?(entity: Entity): void;

  /**
   * Called as soon as the given entity gets removed from the engine.
   *
   * @param {Entity} entity
   */
  onRemovedEntity?(entity: Entity): void;

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
   * The sealed list of active systems which is used to iterate during the update.
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
      onAdded: system => {
        this._systems.sort(sys => sys.priority);
        system.engine = this;
        this.updatedActiveSystems();
        this.dispatch('onAddedSystem', system);
      },
      onRemoved: system => {
        system.engine = null;
        this.updatedActiveSystems();
        this.dispatch('onRemovedSystem', system);
      },
      onCleared: () => this.dispatch('onClearedSystems'),
    });

    this._entites.addListener({
      onAdded: entity => {
        const cache = this.entityCache;
        const keys = Object.keys(cache);
        // On the next update the filter will be also applied for the new entity
        keys.forEach(key => {
          const re = cache[key].filter(entity);
          if (re) cache[key].entities.push(entity);
        });
        this.dispatch('onAddedEntity', entity);
      },
      onRemoved: entity => {
        const cache = this.entityCache;
        const keys = Object.keys(cache);
        // On the next update the entity won't be part of filtered system updates, too
        keys.forEach(key => {
          const idx = cache[key].entities.indexOf(entity);
          if (idx >= 0) cache[key].entities.splice(idx, 1);
        });
        this.dispatch('onRemovedEntity', entity)
      },
      onCleared: () => this.dispatch('onClearedEntities'),
    });

    this.updatedActiveSystems();
  }

  /**
   * A snapshot of all entities in this engine.
   *
   * @readonly
   * @type {Entity[]}
   */
  get entities(): Entity[] {
    return this._entites.objects;
  }

  /**
   * A snapshot of all systems in this engine.
   *
   * @readonly
   * @type {Entity[]}
   */
  get systems(): System[] {
    return this._systems.objects;
  }

  /**
   * A snapshot of all active systems in this engine.
   *
   * @readonly
   * @type {Entity[]}
   */
  get activeSystems(): System[] {
    return this._activeSystems;
  }

  /**
   * Updates the internal active system list.
   *
   * @protected
   */
  protected updatedActiveSystems(): void {
    this._activeSystems = this.systems.filter(system => system.active);
    Object.seal(this._activeSystems);
  }

  /**
   * Updates all systems in this engine by the given delta value.
   *
   * @param {number} delta
   */
  update(delta: number): void {
    const length = this._activeSystems.length;
    for (let i = 0; i < length; i++)
      this._activeSystems[i].update(delta);
  }

  /**
   * Adds the given system to this engine.
   *
   * @param {System} system
   * @returns {boolean} Whether the system has been added or not.
   *                    It may not be added, if already present in the system collection.
   */
  addSystem(system: System): boolean {
    return this._systems.add(system);
  }

  /**
   * Removes the given system or the system at the given index from this engine.
   *
   * @param {(System | number)} systemOrIndex
   * @returns {boolean} Whether the system has been removed or not.
   *                    It may not have been removed, if it was not in the system collection.
   */
  removeSystem(systemOrIndex: System | number): boolean {
    return this._systems.remove(systemOrIndex);
  }

  /**
   * Clears all systems from this engine.
   *
   * @returns {void}
   */
  clearSystems(): void {
    return this._systems.clear();
  }

  /**
   * Adds the given entity to this engine.
   *
   * @param {Entity} entity
   * @returns {boolean} Whether the entity has been added or not.
   *                    It may not be added, if already present in the entity collection.
   */
  addEntity(entity: Entity): boolean {
    return this._entites.add(entity);
  }

  /**
   * Removes the given entity or the entity at the given index from this engine.
   *
   * @param {(Entity | number)} entityOrIndex
   * @returns {boolean} Whether the entity has been removed or not.
   *                    It may not have been removed, if it was not in the entity collection.
   */
  removeEntity(entityOrIndex: Entity | number): boolean {
    return this._entites.remove(entityOrIndex);
  }

  /**
   * Clears all entities from this engine.
   *
   * @returns {void}
   */
  clearEntities(): void {
    return this._entites.clear();
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

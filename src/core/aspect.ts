import { Component, ComponentCollection } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity, EntityListener } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';

type CompClass = ComponentClass<Component>;
type EntityCollection = Collection<AbstractEntity>;

/**
 * Generates a function for the given list of component types.
 *
 * The function will match any component which matches one the given types.
 *
 * @param {ComponentCollection} comps
 * @returns {(type: CompClass, index: number, array: readonly CompClass[]) => unknown}
 */
function predicateFn(comps: ComponentCollection): (type: CompClass, index: number, array: readonly CompClass[]) => unknown {
  return comp => {
    return comps.find(c => {
      const compType = <CompClass>c.constructor;
      if (compType.type) return comp.type === compType.type;
      else return comp === compType;
    }) !== void 0;
  };
}

/**
 * Describes the constraints of an aspect.
 *
 * @export
 * @interface AspectDescriptor
 */
export interface AspectDescriptor {

  /**
   * Components which all have to be matched by an entity.
   *
   * @type {CompClass[]}
   */
  all: CompClass[],

  /**
   * Components which are not allowed to be matched by an entity.
   *
   * @type {CompClass[]}
   */
  exclude: CompClass[],

  /**
   * Components which of which at least one has to be matched by an entity.
   *
   * @type {CompClass[]}
   */
  one: CompClass[]
}

/**
 * An aspect is used to filter a collection of entities by component types.
 *
 * Use @see {Aspect#get} to obtain an aspect for a list of components to observe on an engine or a collection of entities.
 * The obtained aspect instance will take care of synchronizing with the source collection in an efficient way.
 * The user will always have snapshot of entities which meet the aspect criteria no matter when an entity got
 * added or removed.
 *
 * @export
 * @class Aspect
 */
export class Aspect {

  /**
   * Component types which all have to be matched by the entity source.
   *
   * @protected
   * @type {CompClass[]}
   */
  protected allComponents: CompClass[];

  /**
   * Component types which all are not allowed to match.
   *
   * @protected
   * @type {CompClass[]}
   */
  protected excludeComponents: CompClass[];

  /**
   * Component types of which at least one has to match.
   *
   * @protected
   * @type {CompClass[]}
   */
  protected oneComponents: CompClass[];

  /**
   * The entities which meet the filter conditions.
   *
   * @protected
   * @type {AbstractEntity[]}
   */
  protected filteredEntities: AbstractEntity[];

  /**
   * A frozen copy of the filtered entities for the public access.
   *
   * @protected
   * @type {AbstractEntity[]}
   */
  protected frozenEntities: AbstractEntity[];

  /**
   * The collection listener for syncing data.
   *
   * @protected
   * @type {CollectionListener<AbstractEntity>}
   */
  protected listener: CollectionListener<AbstractEntity>;

  /**
   * Whether this filter is currently attached to its collection as a listener or not.
   *
   * @protected
   * @type {boolean}
   */
  protected attached = false;

  /**
   * Creates an instance of an Aspect.
   *
   * @param {Collection<AbstractEntity>} source The collection of entities to filter.
   * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
   * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
   * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
   */
  protected constructor(public source: EntityCollection, all?: CompClass[], exclude?: CompClass[], one?: CompClass[]) {
    this.filteredEntities = [];
    this.frozenEntities = [];
    this.allComponents = all ? all : [];
    this.excludeComponents = exclude ? exclude : [];
    this.oneComponents = one ? one : [];
    this.listener = {
      onAdded: (...entities: AbstractEntity[]) => {
        const before = this.filteredEntities.length;
        entities.forEach(entity => {
          if (this.matches(entity)) this.filteredEntities.push(entity);
        });
        this.setupComponentSync(entities);
        if (this.filteredEntities.length !== before) this.updateFrozen();
      },
      onRemoved: (...entities: AbstractEntity[]) => {
        const before = this.filteredEntities.length;
        entities.forEach(entity => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx >= 0) this.filteredEntities.splice(idx, 1);
        });
        this.removeComponentSync(entities);
        if (this.filteredEntities.length !== before) this.updateFrozen();
      },
      onCleared: () => {
        this.removeComponentSync(this.filteredEntities);
        this.filteredEntities = [];
        this.updateFrozen();
      },
      onSorted: () => {
        this.filteredEntities = this.source.filter(this.matches, this);
        this.updateFrozen();
      },
    };
    this.setUp();
  }

  /**
   * Performs all necessary steps to guarantee that the filter will be apply properly to the current collection.
   *
   * @returns {void}
   */
  protected setUp(): void {
    this.matchAll();
    this.attach();
  }

  protected matchAll(): void {
    this.filteredEntities = this.source.filter(this.matches, this);
    this.setupComponentSync(this.filteredEntities);
    this.updateFrozen();
  }

  /**
   * Checks whether the given entity matches the constraints on this aspect.
   *
   * @param {AbstractEntity} entity The entity to check for.
   * @returns {boolean} Whether the given entity has at least one component which matches.
   */
  matches(entity: AbstractEntity): boolean {
    const comps = entity.components;
    if (comps.length === 0) return false;
    const testFn = predicateFn(comps);

    // First check if "all"-component types are matched
    if (this.allComponents.length > 0 && !this.allComponents.every(testFn))
      return false;

    // Then check if "exclude"-component types are NOT matched
    if (this.excludeComponents.length > 0 && this.excludeComponents.some(testFn))
      return false;

    // Lastly check if "one"-component types are matched
    if (this.oneComponents.length > 0 && !this.oneComponents.some(testFn))
      return false;

    return true;
  }

  /**
   * Updates the frozen entities.
   *
   * @returns {void}
   */
  protected updateFrozen(): void {
    this.frozenEntities = this.filteredEntities.slice();
    Object.freeze(this.frozenEntities);
  }

  /**
   * Sets up the component sync logic.
   *
   * @param {AbstractEntity[]} entities The entities to perform the setup for.
   * @return {void}
   */
  protected setupComponentSync(entities: AbstractEntity[]): void {
    entities.forEach(entity => {
      if ((<any>entity).__ecsEntityListener) return;
      const entityListener: EntityListener = {
        onAddedComponents: () => {
          if (this.filteredEntities.indexOf(entity) >= 0) return;
          if (this.matches(entity)) {
            this.filteredEntities.push(entity);
            this.updateFrozen();
          }
        },
        onRemovedComponents: () => {
          if (this.filteredEntities.indexOf(entity) < 0) return;
          if (!this.matches(entity)) {
            const idx = this.filteredEntities.indexOf(entity);
            if (idx >= 0) {
              this.filteredEntities.splice(idx, 1);
              this.updateFrozen();
            }
          }
        },
        onClearedComponents: () => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx >= 0) {
            this.filteredEntities.splice(idx, 1);
            this.updateFrozen();
          }
        }
      };
      (<any>entity).__ecsEntityListener = entityListener;
      entity.addListener(entityListener);
    });
  }

  /**
   * Removes the component sync logic.
   *
   * @param {AbstractEntity[]} entities The entities to remove the setup from.
   * @return {void}
   */
  protected removeComponentSync(entities: AbstractEntity[]) {
    entities.forEach(entity => {
      const entityListener: EntityListener = (<any>entity).__ecsEntityListener;
      const locked: EntityListener[] = (<any>entity)._lockedListeners;
      locked.splice(locked.indexOf(entityListener), 1);
      entity.removeListener(entityListener);
    });
  }

  /**
   * Attaches this filter to its collection.
   *
   * @returns {void}
   */
  attach(): void {
    if (this.attached) return;
    this.source.addListener(this.listener);
    this.attached = true;
  }

  /**
   * Detaches this filter from its collection.
   *
   * @returns {void}
   */
  detach(): void {
    if (!this.attached) return;
    this.source.removeListener(this.listener);
    this.attached = false;
  }

  /**
   * Whether this filter is attached to its collection or not.
   *
   * @readonly
   * @type {boolean}
   */
  get isAttached(): boolean {
    return this.attached;
  }

  /**
   * The entities which match the criteria of this filter.
   *
   * @readonly
   * @type {AbstractEntity[]}
   */
  get entities(): readonly AbstractEntity[] {
    return this.frozenEntities;
  }

  /**
   * Includes all the given component types.
   *
   * Entities have to match every type.
   *
   * @param {ComponentClass<Component>} classes
   */
  all(...classes: CompClass[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.allComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#all}
   * @param {ComponentClass<Component>} classes
   */
  every(...classes: CompClass[]): this {
    return this.all.apply(this, classes);
  }

  /**
   * Excludes all of the given component types.
   *
   * Entities have to exclude all types.
   *
   * @param {ComponentClass<Component>} classes
   */
  exclude(...classes: CompClass[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.excludeComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#exclude}
   * @param {ComponentClass<Component>[]} classes
   */
  without(...classes: CompClass[]): this {
    return this.exclude.apply(this, classes);
  }

  /**
   * Includes one of the given component types.
   *
   * Entities have to match only one type.
   *
   * @param {ComponentClass<Component>[]} classes
   */
  one(...classes: CompClass[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.oneComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#one}
   * @param {ComponentClass<Component>[]} classes
   */
  some(...classes: CompClass[]): this {
    return this.one.apply(this, classes);
  }


  getDescriptor(): AspectDescriptor {
    return {
      all: this.allComponents.slice(),
      exclude: this.excludeComponents.slice(),
      one: this.oneComponents.slice(),
    }
  }

  /**
   * Returns an aspect for the given engine or collection of entities.
   *
   * @param {Collection<AbstractEntity> | Engine} collOrEngine
   * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
   * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
   * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
   * @returns {Aspect}
   */
  static for(collOrEngine: EntityCollection | Engine, all?: CompClass[], exclude?: CompClass[], one?: CompClass[]): Aspect {
    const entities = collOrEngine instanceof Engine ? collOrEngine.entities : collOrEngine;
    return new Aspect(entities, all, exclude, one);
  }

}

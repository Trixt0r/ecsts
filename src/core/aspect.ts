import { Component, ComponentCollection } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity, EntityListener } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
import { Dispatcher } from './dispatcher';

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
 * Listener which listens to various aspect events.
 *
 * @interface AspectListener
 */
export interface AspectListener {

  /**
   * Called if new entities got added to the aspect.
   *
   * @param {...AbstractEntity[]} entities
   * @returns {void}
   */
  onAddedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called if existing entities got removed from the aspect.
   *
   * @param {...AbstractEntity[]} entities
   * @returns {void}
   */
  onRemovedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called if the source entities got cleared.
   *
   * @returns {void}
   */
  onClearedEntities?(): void;

  /**
   * Called if the source entities got sorted.
   *
   * @returns {void}
   */
  onSortedEntities?(): void;

  /**
   * Gets called if new components got added to the given entity.
   *
   * @param {AbstractEntity} entity
   * @param {...Component[]} components
   * @returns {void}
   */
  onAddedComponents?(entity: AbstractEntity, ...components: Component[]): void;

  /**
   * Gets called if components got removed from the given entity.
   *
   * @param {AbstractEntity} entity
   * @param {...Component[]} components
   * @returns {void}
   */
  onRemovedComponents?(entity: AbstractEntity, ...components: Component[]): void;

  /**
   * Gets called if the components of the given entity got cleared.
   *
   * @param {AbstractEntity} entity
   * @returns {void}
   */
  onClearedComponents?(entity: AbstractEntity): void;

  /**
   * Gets called if the components of the given entity got sorted.
   *
   * @param {AbstractEntity} entity
   * @returns {void}
   */
  onSortedComponents?(entity: AbstractEntity): void;

  /**
   * Gets called if the aspect got attached.
   *
   * @returns {void}
   */
  onAttached?(): void;

  /**
   * Gets called if the aspect got detached.
   *
   * @returns {void}
   */
  onDetached?(): void;
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
export class Aspect<L extends AspectListener = AspectListener> extends Dispatcher<L> {

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
    super();
    this.filteredEntities = [];
    this.frozenEntities = [];
    this.allComponents = all ? all : [];
    this.excludeComponents = exclude ? exclude : [];
    this.oneComponents = one ? one : [];
    this.listener = {
      onAdded: (...entities: AbstractEntity[]) => {
        const added = entities.filter(entity => {
          if (!this.matches(entity)) return false;
          this.filteredEntities.push(entity);
          return true;
        });
        this.setupComponentSync(entities);
        if (added.length === 0) return;
        this.updateFrozen();
        const args = <['onAddedEntities', ...AbstractEntity[]]>['onAddedEntities', ...added];
        (<Dispatcher<AspectListener>>this).dispatch.apply(this, args);
      },
      onRemoved: (...entities: AbstractEntity[]) => {
        const removed = entities.filter(entity => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return false;
          this.filteredEntities.splice(idx, 1);
          return true;
        });
        this.removeComponentSync(entities);
        if (removed.length === 0) return;
        this.updateFrozen();
        const args = <['onRemovedEntities', ...AbstractEntity[]]>['onRemovedEntities', ...removed];
        (<Dispatcher<AspectListener>>this).dispatch.apply(this, args);
      },
      onCleared: () => {
        if (this.filteredEntities.length === 0) return;
        this.removeComponentSync(this.filteredEntities);
        this.filteredEntities = [];
        this.updateFrozen();
        (<Dispatcher<AspectListener>>this).dispatch('onClearedEntities');
      },
      onSorted: () => {
        if (this.filteredEntities.length === 0) return;
        this.filteredEntities = this.source.filter(this.matches, this);
        this.updateFrozen();
        (<Dispatcher<AspectListener>>this).dispatch('onSortedEntities');
      },
    };
    this.attach();
  }

  /**
   * Performs the match on each entity in the source collection.
   *
   * @returns {void}
   */
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
        onAddedComponents: (...comps: Component[]) => {
          if (this.filteredEntities.indexOf(entity) >= 0) return;
          const args =<['onAddedComponents', AbstractEntity, ...Component[]]>['onAddedComponents', entity, ...comps];
          (<Dispatcher<AspectListener>>this).dispatch.apply(this, args);
          if (!this.matches(entity)) return;
          this.filteredEntities.push(entity);
          this.updateFrozen();
          (<Dispatcher<AspectListener>>this).dispatch('onAddedEntities', entity);
        },
        onRemovedComponents: (...comps: Component[]) => {
          if (this.filteredEntities.indexOf(entity) < 0) return;
          const args =<['onRemovedComponents', AbstractEntity, ...Component[]]>['onRemovedComponents', entity, ...comps];
          (<Dispatcher<AspectListener>>this).dispatch.apply(this, args);
          if (this.matches(entity)) return;
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return;
          this.filteredEntities.splice(idx, 1);
          this.updateFrozen();
          (<Dispatcher<AspectListener>>this).dispatch('onRemovedEntities', entity);
        },
        onClearedComponents: () => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return;
          this.filteredEntities.splice(idx, 1);
          this.updateFrozen();
          if (this.filteredEntities.indexOf(entity) < 0)
            (<Dispatcher<AspectListener>>this).dispatch('onRemovedEntities', entity);
          (<Dispatcher<AspectListener>>this).dispatch('onClearedComponents', entity);
        },
        onSortedComponents: () => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return;
          (<Dispatcher<AspectListener>>this).dispatch('onSortedComponents', entity);
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
  protected removeComponentSync(entities: Readonly<AbstractEntity[]>) {
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
    this.matchAll();
    this.source.addListener(this.listener);
    this.attached = true;
    (<Dispatcher<AspectListener>>this).dispatch('onAttached');
  }

  /**
   * Detaches this filter from its collection.
   *
   * @returns {void}
   */
  detach(): void {
    if (!this.attached) return;
    this.source.removeListener(this.listener);
    this.removeComponentSync(this.source.elements);
    this.attached = false;
    (<Dispatcher<AspectListener>>this).dispatch('onDetached');
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

  /**
   * Collects information about this aspect and returns it.
   *
   * @returns {AspectDescriptor}
   */
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

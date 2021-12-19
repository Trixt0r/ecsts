import { Component, ComponentCollection } from './component';
import { Collection, CollectionListener } from './collection';
import { AbstractEntity, EntityListener } from './entity';
import { Engine } from './engine';
import { ComponentClass } from './types';
import { Dispatcher } from './dispatcher';

/**
 * Component or component class.
 */
type CompType = ComponentClass<Component> | Component;

/**
 * A collection of entities.
 */
type EntityCollection = Collection<AbstractEntity>;

/**
 * Entity which is synced within an aspect.
 */
type SyncedEntity = AbstractEntity & {
  /**
   * Entity listener mapping for aspect specific caching purposes.
   */
  __ecsEntityListener: Record<number, EntityListener>;

  /**
   * The list of listeners for this entity.
   */
  _lockedListeners: EntityListener[];
};

/**
 * Generates a function for the given list of component types.
 *
 * The function will match any component which matches one of the given types.
 *
 * @param comps
 *
 */
function predicateFn(
  comps: ComponentCollection
): (type: CompType, index: number, array: readonly CompType[]) => unknown {
  return comp => {
    const constr = (<ComponentClass<Component>>comp).constructor;
    if (constr !== Object)
      return (
        comps.find(c => {
          const compType = <ComponentClass<Component>>c.constructor;
          if (compType.id) return compType.id === comp.id;
          else if (compType.type) return comp.type === compType.type;
          else {
            const ok = comp === compType;
            if (ok) return true;
            if (c.id) return comp.id === c.id;
            else if (c.type) return comp.type === c.type;
            else return false;
          }
        }) !== void 0
      );
    else
      return (
        comps.find(c => {
          if (c.id) return comp.id === c.id;
          else if (c.type) return comp.type === c.type;
          else return false;
        }) !== void 0
      );
  };
}

/**
 * Describes the constraints of an aspect.
 */
export interface AspectDescriptor {
  /**
   * Components which all have to be matched by an entity.
   */
  all: CompType[];

  /**
   * Components which are not allowed to be matched by an entity.
   */
  exclude: CompType[];

  /**
   * Components of which at least one has to be matched by an entity.
   */
  one: CompType[];
}

/**
 * Listener which listens to various aspect events.
 */
export interface AspectListener {
  /**
   * Called if new entities got added to the aspect.
   *
   * @param entities
   *
   */
  onAddedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called if existing entities got removed from the aspect.
   *
   * @param entities
   *
   */
  onRemovedEntities?(...entities: AbstractEntity[]): void;

  /**
   * Called if the source entities got cleared.
   *
   *
   */
  onClearedEntities?(): void;

  /**
   * Called if the source entities got sorted.
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

  /**
   * Gets called if the aspect got attached.
   *
   *
   */
  onAttached?(): void;

  /**
   * Gets called if the aspect got detached.
   *
   *
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
 */
export class Aspect<L extends AspectListener = AspectListener> extends Dispatcher<L> {
  /**
   * Internal index.
   */
  protected static ID = 0;

  /**
   * Internal unique id.
   */
  protected readonly id: number;

  /**
   * Component types which all have to be matched by the entity source.
   */
  protected allComponents: CompType[];

  /**
   * Component types which all are not allowed to match.
   */
  protected excludeComponents: CompType[];

  /**
   * Component types of which at least one has to match.
   */
  protected oneComponents: CompType[];

  /**
   * The entities which meet the filter conditions.
   */
  protected filteredEntities: SyncedEntity[];

  /**
   * A frozen copy of the filtered entities for the public access.
   */
  protected frozenEntities: AbstractEntity[];

  /**
   * The collection listener for syncing data.
   */
  protected listener: CollectionListener<AbstractEntity>;

  /**
   * Whether this filter is currently attached to its collection as a listener or not.
   */
  protected attached = false;

  /**
   * Creates an instance of an Aspect.
   *
   * @param source The collection of entities to filter.
   * @param all Optional component types which should all match.
   * @param exclude Optional component types which should not match.
   * @param one Optional component types of which at least one should match.
   */
  protected constructor(public source: EntityCollection, all?: CompType[], exclude?: CompType[], one?: CompType[]) {
    super();
    this.id = Aspect.ID++;
    this.filteredEntities = [];
    this.frozenEntities = [];
    this.allComponents = all ? all : [];
    this.excludeComponents = exclude ? exclude : [];
    this.oneComponents = one ? one : [];
    this.listener = {
      onAdded: (...entities: SyncedEntity[]) => {
        const added = entities.filter(entity => {
          if (!this.matches(entity)) return false;
          this.filteredEntities.push(entity);
          return true;
        });
        this.setupComponentSync(entities);
        if (added.length <= 0) return;
        this.updateFrozen();
        this.updateFrozen;
        (<Dispatcher<AspectListener>>this).dispatch('onAddedEntities', ...added);
      },
      onRemoved: (...entities: SyncedEntity[]) => {
        const removed = entities.filter(entity => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return false;
          this.filteredEntities.splice(idx, 1);
          return true;
        });
        this.removeComponentSync(entities);
        if (removed.length === 0) return;
        this.updateFrozen();
        (<Dispatcher<AspectListener>>this).dispatch('onRemovedEntities', ...removed);
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
        this.filteredEntities = this.source.filter(this.matches, this) as SyncedEntity[];
        this.updateFrozen();
        (<Dispatcher<AspectListener>>this).dispatch('onSortedEntities');
      },
    };
    this.attach();
  }

  /**
   * Performs the match on each entity in the source collection.
   *
   *
   */
  protected matchAll(): void {
    this.filteredEntities = this.source.filter(this.matches, this) as SyncedEntity[];
    this.setupComponentSync(this.filteredEntities);
    this.updateFrozen();
  }

  /**
   * Checks whether the given entity matches the constraints on this aspect.
   *
   * @param entity The entity to check for.
   * @return Whether the given entity has at least one component which matches.
   */
  matches(entity: AbstractEntity): boolean {
    const comps = entity.components;
    const testFn = predicateFn(comps);

    // First check if "all"-component types are matched
    if (this.allComponents.length > 0 && !this.allComponents.every(testFn)) return false;

    // Then check if "exclude"-component types are NOT matched
    if (this.excludeComponents.length > 0 && this.excludeComponents.some(testFn)) return false;

    // Lastly check if "one"-component types are matched
    if (this.oneComponents.length > 0 && !this.oneComponents.some(testFn)) return false;

    return true;
  }

  /**
   * Updates the frozen entities.
   *
   *
   */
  protected updateFrozen(): void {
    this.frozenEntities = this.filteredEntities.slice();
    Object.freeze(this.frozenEntities);
  }

  /**
   * Sets up the component sync logic.
   *
   * @param entities The entities to perform the setup for.
   * @return {void}
   */
  protected setupComponentSync(entities: SyncedEntity[]): void {
    entities.forEach(entity => {
      if (!entity.__ecsEntityListener) entity.__ecsEntityListener = {};
      if (entity.__ecsEntityListener[this.id]) return;
      const update = () => {
        const idx = this.filteredEntities.indexOf(entity);
        const matches = this.matches(entity);
        if (idx >= 0 && !matches) {
          this.filteredEntities.splice(idx, 1);
          this.updateFrozen();
          (<Dispatcher<AspectListener>>this).dispatch('onRemovedEntities', entity);
          return true;
        } else if (matches && idx < 0) {
          this.filteredEntities.push(entity);
          this.updateFrozen();
          (<Dispatcher<AspectListener>>this).dispatch('onAddedEntities', entity);
          return true;
        }
        return false;
      };
      const entityListener: EntityListener = {
        onAddedComponents: (...comps: Component[]) => {
          (<Dispatcher<AspectListener>>this).dispatch('onAddedComponents', entity, ...comps);
          update();
        },
        onRemovedComponents: (...comps: Component[]) => {
          (<Dispatcher<AspectListener>>this).dispatch('onRemovedComponents', entity, ...comps);
          update();
        },
        onClearedComponents: () => {
          if (update()) (<Dispatcher<AspectListener>>this).dispatch('onClearedComponents', entity);
        },
        onSortedComponents: () => {
          const idx = this.filteredEntities.indexOf(entity);
          if (idx < 0) return;
          (<Dispatcher<AspectListener>>this).dispatch('onSortedComponents', entity);
        },
      };
      entity.__ecsEntityListener[this.id] = entityListener;
      entity.addListener(entityListener);
    });
  }

  /**
   * Removes the component sync logic.
   *
   * @param entities The entities to remove the setup from.
   * @return {void}
   */
  protected removeComponentSync(entities: Readonly<SyncedEntity[]>) {
    entities.forEach(entity => {
      if (!(entity as SyncedEntity).__ecsEntityListener) (entity as SyncedEntity).__ecsEntityListener = {};
      const entityListener: EntityListener = entity.__ecsEntityListener[this.id];
      if (!entityListener) return;
      const locked: EntityListener[] = entity._lockedListeners;
      locked.splice(locked.indexOf(entityListener), 1);
      entity.removeListener(entityListener);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (entity as any).__ecsEntityListener[this.id];
    });
  }

  /**
   * Attaches this filter to its collection.
   *
   *
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
   *
   */
  detach(): void {
    if (!this.attached) return;
    this.source.removeListener(this.listener);
    this.removeComponentSync(this.source.elements as SyncedEntity[]);
    this.attached = false;
    (<Dispatcher<AspectListener>>this).dispatch('onDetached');
  }

  /**
   * Whether this filter is attached to its collection or not.
   */
  get isAttached(): boolean {
    return this.attached;
  }

  /**
   * The entities which match the criteria of this filter.
   */
  get entities(): readonly AbstractEntity[] {
    return this.frozenEntities;
  }

  /**
   * Includes all the given component types.
   *
   * Entities have to match every type.
   *
   * @param classes
   */
  all(...classes: CompType[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.allComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#all}
   * @param classes
   */
  every(...classes: CompType[]): this {
    return this.all(...classes);
  }

  /**
   * Excludes all of the given component types.
   *
   * Entities have to exclude all types.
   *
   * @param classes
   */
  exclude(...classes: CompType[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.excludeComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#exclude}
   * @param classes
   */
  without(...classes: CompType[]): this {
    return this.exclude(...classes);
  }

  /**
   * Includes one of the given component types.
   *
   * Entities have to match only one type.
   *
   * @param classes
   */
  one(...classes: CompType[]): this {
    const unique = classes.filter((value, index, self) => self.indexOf(value) === index);
    this.oneComponents = unique;
    this.matchAll();
    return this;
  }

  /**
   * @alias @see {Aspect#one}
   * @param classes
   */
  some(...classes: CompType[]): this {
    return this.one(...classes);
  }

  /**
   * Collects information about this aspect and returns it.
   *
   *
   */
  getDescriptor(): AspectDescriptor {
    return {
      all: this.allComponents.slice(),
      exclude: this.excludeComponents.slice(),
      one: this.oneComponents.slice(),
    };
  }

  /**
   * Returns an aspect for the given engine or collection of entities.
   *
   * @param collOrEngine
   * @param all Optional component types which should all match.
   * @param exclude Optional component types which should not match.
   * @param one Optional component types of which at least one should match.
   *
   */
  static for(
    collOrEngine: EntityCollection | Engine,
    all?: CompType[],
    exclude?: CompType[],
    one?: CompType[]
  ): Aspect {
    const entities = collOrEngine instanceof Engine ? collOrEngine.entities : collOrEngine;
    return new Aspect(entities, all, exclude, one);
  }
}

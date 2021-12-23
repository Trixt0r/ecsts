/* eslint-disable @typescript-eslint/no-empty-function */
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
   * @param engine The engine this system got removed from.
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
export enum SystemMode {
  /**
   * Do work and resolve immediately.
   */
  SYNC = 'runSync',

  /**
   * Do async work. E.g. do work in a worker, make requests to another server, etc.
   */
  ASYNC = 'runAsync',
}

/**
 * A system processes a list of entities which belong to an engine.
 * Entities can only be accessed via the assigned engine. @see {Engine}.
 * The implementation of the specific system has to choose on which components of an entity to operate.
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class System<L extends SystemListener = SystemListener, T = any> extends Dispatcher<L> {
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
  constructor(public priority: number = 0) {
    super();
    this._active = true;
    this._updating = false;
    this._engine = null;
  }

  /**
   * The active state of this system.
   * If the flag is set to `false`, this system will not be able to process.
   *
   */
  get active(): boolean {
    return this._active;
  }

  set active(active: boolean) {
    if (active === this._active) return;
    this._active = active;
    if (active) {
      this.onActivated();
    } else {
      this.onDeactivated();
    }
    (<Dispatcher<SystemListener>>this).dispatch(active ? 'onActivated' : 'onDeactivated');
  }

  /**
   * The engine this system is assigned to.
   *
   */
  get engine(): Engine | null {
    return this._engine;
  }

  set engine(engine: Engine | null) {
    if (engine === this._engine) return;
    const oldEngine = this._engine;
    this._engine = engine;
    if (oldEngine instanceof Engine) {
      this.onRemovedFromEngine(oldEngine);
      (<Dispatcher<SystemListener>>this).dispatch('onRemovedFromEngine', oldEngine);
    }
    if (engine instanceof Engine) {
      this.onAddedToEngine(engine);
      (<Dispatcher<SystemListener>>this).dispatch('onAddedToEngine', engine);
    }
  }

  /**
   * Determines whether this system is currently updating or not.
   * The value will stay `true` until @see {System#process} resolves or rejects.
   *
   * @readonly
   */
  get updating(): boolean {
    return this._updating;
  }

  /**
   * Runs the system process with the given delta time.
   *
   * @param options
   * @param mode The system mode to run in.
   *
   */
  run(options: T, mode: SystemMode = SystemMode.SYNC): void | Promise<void> {
    return this[mode].call(this, options);
  }

  /**
   * Processes data synchronously.
   *
   * @param options
   *
   */
  protected runSync(options: T): void {
    try {
      this.process(options);
    } catch (e) {
      this.onError(e as Error);
      (<Dispatcher<SystemListener>>this).dispatch('onError', e as Error);
    }
  }

  /**
   * Processes data asynchronously.
   *
   * @param options
   *
   */
  protected async runAsync(options: T): Promise<void> {
    this._updating = true;
    try {
      await this.process(options);
    } catch (e) {
      this.onError(e as Error);
      (<Dispatcher<SystemListener>>this).dispatch('onError', e as Error);
    } finally {
      this._updating = false;
    }
  }

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
  onActivated(): void {
    /* NOOP */
  }

  /**
   * Called as soon as the `active` switched to `false`.
   *
   *
   */
  onDeactivated(): void {
    /* NOOP */
  }

  /**
   * Called as soon as the system got removed from an engine.
   *
   * @param engine The engine this system got added to.
   *
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemovedFromEngine(engine: Engine): void {
    /* NOOP */
  }

  /**
   * Called as soon as the system got added to an engine.
   * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
   *
   * @param engine The engine this system got added to.
   *
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddedToEngine(engine: Engine): void {
    /* NOOP */
  }

  /**
   * Called as soon an error occurred during update.
   *
   * @param error The error which occurred.
   *
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onError(error: Error): void {
    /* NOOP */
  }
}

type CompType = ComponentClass<Component> | Component;

/**
 * An abstract entity system is a system which processes each entity.
 *
 * Optionally it accepts component types for auto filtering the entities before processing.
 * This class abstracts away the initialization of aspects and detaches them properly, if needed.
 *
 */
export abstract class AbstractEntitySystem<T extends AbstractEntity = AbstractEntity>
  extends System
  implements AspectListener
{
  /**
   * The optional aspect, if any.
   *
   */
  protected aspect: Aspect | null = null;

  /**
   * Creates an instance of AbstractEntitySystem.
   *
   * @param priority The priority of this system. The lower the value the earlier it will process.
   * @param all Optional component types which should all match.
   * @param exclude Optional component types which should not match.
   * @param one Optional component types of which at least one should match.
   */
  constructor(
    public priority = 0,
    protected all?: CompType[],
    protected exclude?: CompType[],
    protected one?: CompType[]
  ) {
    super(priority);
  }

  /** @inheritdoc */
  onAddedToEngine(engine: Engine): void {
    this.aspect = Aspect.for(engine, this.all, this.exclude, this.one);
    this.aspect.addListener(this);
  }

  /** @inheritdoc */
  onRemovedFromEngine(): void {
    if (!this.aspect) return;
    this.aspect.removeListener(this);
    this.aspect.detach();
  }

  /**
   * Called if new entities got added to the system.
   *
   * @param entities
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddedEntities(...entities: AbstractEntity[]): void {}

  /**
   * Called if existing entities got removed from the system.
   *
   * @param entities
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemovedEntities?(...entities: AbstractEntity[]): void {}

  /**
   * Called if the entities got cleared.
   *
   *
   */
  onClearedEntities?(): void {}

  /**
   * Called if the entities got sorted.
   *
   *
   */
  onSortedEntities?(): void {}

  /**
   * Gets called if new components got added to the given entity.
   *
   * @param entity
   * @param components
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddedComponents?(entity: AbstractEntity, ...components: Component[]): void {}

  /**
   * Gets called if components got removed from the given entity.
   *
   * @param entity
   * @param components
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemovedComponents?(entity: AbstractEntity, ...components: Component[]): void {}

  /**
   * Gets called if the components of the given entity got cleared.
   *
   * @param entity
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClearedComponents?(entity: AbstractEntity): void {}

  /**
   * Gets called if the components of the given entity got sorted.
   *
   * @param entity
   *
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSortedComponents?(entity: AbstractEntity): void {}

  /** @inheritdoc */
  process<U>(options?: U): void {
    const entities = this.aspect ? this.aspect.entities : this._engine?.entities.elements;
    if (!entities?.length) return;
    for (let i = 0, l = entities.length; i < l; i++) {
      this.processEntity(<T>entities[i], i, <T[]>entities, options);
    }
  }

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

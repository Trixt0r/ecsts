import { Engine } from './engine';
import { Dispatcher } from './dispatcher';
import { AbstractEntity } from './entity';
import { ComponentClass } from './types';
import { Component } from './component';
import { Aspect } from './aspect';

/**
 * The listener interface for a listener added to a system.
 *
 * @export
 * @interface SystemListener
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
   * @param {Engine} engine The engine this system got added to.
   */
  onRemovedFromEngine?(engine: Engine): void;

  /**
   * Called as soon as the system got added to an engine.
   * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
   *
   * @param {Engine} engine The engine this system got added to.
   */
  onAddedToEngine?(engine: Engine): void;

  /**
   * Called as soon an error occurred during update.
   *
   * @param {Error} error The error which occurred.
   */
  onError?(error: Error): void;
}

/**
 * Defines how a system executes its task.
 *
 * @export
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
 * @export
 * @abstract
 * @class System
 * @extends {Dispatcher<L>}
 * @template L
 */
export abstract class System<L extends SystemListener = SystemListener> extends Dispatcher<L> {

  /**
   * Determines whether this system is active or not.
   *
   * @protected
   * @type {boolean}
   */
  protected _active: boolean;

  /**
   * Determines whether this system is currently updating or not.
   *
   * @protected
   * @type {boolean}
   */
  protected _updating: boolean;

  /**
   * The reference to the current engine.
   *
   * @protected
   * @type {Engine}
   * @memberof System
   */
  protected _engine: Engine | null;

  /**
   * Creates an instance of System.
   *
   * @param {number} [priority=0] The priority of this system. The lower the value the earlier it will process.
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
   * @type {boolean}
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
   * @type {Engine | null}
   */
  get engine(): Engine |null {
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
   * @type {boolean}
   */
  get updating(): boolean {
    return this._updating;
  }

  /**
   * Runs the system process with the given delta time.
   *
   * @param {any} options
   * @param {SystemMode} [mode=SystemMode.SYNC]
   * @returns {void | Promise<void>}
   */
  run(options: any, mode: SystemMode = SystemMode.SYNC): void | Promise<void> {
    return this[mode](options);
  }

  /**
   * Processes data synchronously.
   *
   * @param {any} options
   * @returns {void}
   */
  protected runSync(options: any): void {
    try {
      this.process(options);
    } catch (e) {
      (<Dispatcher<SystemListener>>this).dispatch('onError', e);
    }
  }

  /**
   * Processes data asynchronously.
   *
   * @param {any} options
   * @returns {void}
   */
  protected async runAsync(options: any): Promise<void> {
    this._updating = true;
    try {
      await this.process(options);
    } catch (e) {
      (<Dispatcher<SystemListener>>this).dispatch('onError', e);
    } finally {
      this._updating = false;
    }
  }

  /**
   * Processes the entities of the current engine.
   * To be implemented by any concrete system.
   *
   * @abstract
   * @param {any} options
   * @returns {void | Promise<void>}
   */
  abstract process(options: any): void | Promise<void>;

  /**
   * Called as soon as the `active` switched to `true`.
   *
   * @returns {void}
   */
  onActivated(): void { /* NOOP */ }

  /**
   * Called as soon as the `active` switched to `false`.
   *
   * @returns {void}
   */
  onDeactivated(): void { /* NOOP */ }

  /**
   * Called as soon as the system got removed from an engine.
   *
   * @param {Engine} engine The engine this system got added to.
   *
   * @returns {void}
   */
  onRemovedFromEngine(engine: Engine): void { /* NOOP */ }

  /**
   * Called as soon as the system got added to an engine.
   * Note that this will be called after @see {SystemListener#onRemovedFromEngine}.
   *
   * @param {Engine} engine The engine this system got added to.
   *
   * @returns {void}
   */
  onAddedToEngine(engine: Engine): void { /* NOOP */ }

  /**
   * Called as soon an error occurred during update.
   *
   * @param {Error} error The error which occurred.
   *
   * @returns {void}
   */
  onError(error: Error): void { /* NOOP */ }
}

type CompClass = ComponentClass<Component>;

/**
 * An abstract entity system is a system which processes each entity.
 *
 * Optionally it accepts component types for auto filtering the entities before processing.
 * This class abstracts away the initialization of aspects and detaches them properly, if needed.
 *
 * @export
 * @abstract
 * @class AbstractEntitySystem
 * @extends {System}
 * @template T
 */
export abstract class AbstractEntitySystem<T extends AbstractEntity = AbstractEntity> extends System {

  /**
   * The optional aspect, if any.
   *
   * @protected
   * @type {(Aspect | null)}
   */
  protected aspect: Aspect | null = null;

  /**
   * Creates an instance of AbstractEntitySystem.
   *
   * @param {number} [priority=0] The priority of this system. The lower the value the earlier it will process.
   * @param {ComponentClass<Component>[]} [all] Optional component types which should all match.
   * @param {ComponentClass<Component>[]} [exclude] Optional component types which should not match.
   * @param {ComponentClass<Component>[]} [one] Optional component types of which at least one should match.
   */
  constructor(public priority: number = 0,
              protected all?: CompClass[],
              protected exclude?: CompClass[],
              protected one?: CompClass[]) {
    super(priority);
  }

  /** @inheritdoc */
  onAddedToEngine(engine: Engine): void {
    if (this.all || this.exclude || this.one) {
      this.aspect = Aspect.for(engine, this.all, this.exclude, this.one);
    }
  }

  /** @inheritdoc */
  onRemovedFromEngine(): void {
    if (!this.aspect) return;
    this.aspect.detach();
  }

  /** @inheritdoc */
  process(options?: any): void {
    if (!this._engine) return;
    const entities = this.aspect ? this.aspect.entities : this._engine.entities.elements;
    for (let i = 0, l = entities.length; i < l; i++) {
      this.processEntity(<T>entities[i], i, <T[]>entities, options);
    }
  }

  /**
   * Processes the given entity.
   *
   * @abstract
   * @param {T} entity
   * @param {number} [index]
   * @param {T[]} [entities]
   * @param {any} [options]
   * @returns {void}
   */
  abstract processEntity(entity: T, index?: number, entities?: T[] , options?: any): void;

}

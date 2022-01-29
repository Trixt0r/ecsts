import { Component } from './component';

/**
 * A type for the arguments of `F`.
 */
export type ArgumentTypes<F> = F extends (...args: infer A) => unknown ? A : never;

/**
 * Class definition for type `T`.
 */
export interface Class<T> extends Function {
  new (...args: never[]): T;
}

/**
 * Class definition for a component type `T`.
 */
export interface ComponentClass<T extends Component> extends Class<T> {
  /**
   * The static id of the component.
   *
   */
  readonly id?: string;

  /**
   * The static type of the component.
   *
   */
  readonly type?: string;
}

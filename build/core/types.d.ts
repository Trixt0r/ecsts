import { Component } from "./component";
/**
 * A type for the arguments of `F`.
 *
 * @type {ArgumentTypes}
 * @template T
 */
export declare type ArgumentTypes<F> = F extends (...args: infer A) => any ? A : never;
/**
 * Class definition for type `T`.
 *
 * @export
 * @interface Class
 * @extends {Function}
 * @template T
 */
export interface Class<T> extends Function {
    new (...args: any[]): T;
}
/**
 * Class definition for a component type `T`.
 *
 * @export
 * @interface ComponentClass
 * @extends {Class<T>}
 * @template T
 */
export interface ComponentClass<T extends Component> extends Class<T> {
    /**
     * The static type of the component
     *
     * @type {string}
     */
    readonly type?: string;
}

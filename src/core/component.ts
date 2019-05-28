import { Collection } from "./collection";
import { ComponentClass } from "./types";

/**
 * The component interface, every component has to implement.
 *
 * If you want your system to treat differnt Components the same way,
 * you may define a static string variable nameed `type` in your components.
 *
 * @export
 * @interface Component
 */
export interface Component {
}

/**
 * A collection for components.
 * Supports accessing components by their class.
 *
 * @export
 * @class ComponentCollection
 * @extends {Collection<Component>}
 */
export class ComponentCollection extends Collection<Component> {

  /**
   * Searches for the first component matching the given class or type.
   *
   * @todo Use caching, to increase access speed
   * @param {ComponentClass<Component> | string} classOrType The class or type a component has to match.
   * @returns {Component} The found component or `null`.
   */
  get(classOrType: ComponentClass<Component> | string): Component {
    const type = typeof classOrType === 'string' ? classOrType : classOrType.type;
    return this.find(element => {
      const proto = Object.getPrototypeOf(element);
      if (type && proto.constructor && proto.constructor.type)
        return type === proto.constructor.type;
      else if (typeof classOrType !== 'string')
        return proto === classOrType.prototype;
      else
        return false;
    });
  }

  /**
   * Searches for the all components matching the given class or type.
   *
   * @todo Use caching, to increase access speed
   * @param {ComponentClass<Component> | string} classOrType The class or type components have to match.
   * @returns {readonly Component[]} A list of all components matching the given class.
   */
  getAll(classOrType: ComponentClass<Component> | string): readonly Component[] {
    const type = typeof classOrType === 'string' ? classOrType : classOrType.type;
    return this.filter(element => {
      const proto = Object.getPrototypeOf(element);
      if (type && proto.constructor && proto.constructor.type)
        return type === proto.constructor.type;
      else if (typeof classOrType !== 'string')
        return proto === classOrType.prototype;
      else
        return false;
    });
  }

}

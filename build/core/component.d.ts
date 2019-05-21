<<<<<<< HEAD
import { Collection } from "./collection";
import { ComponentClass } from "./types";
/**
 * The component interface, every component has to implement.
 *
 * If you want your system to treat differnt Components the same way,
 * you may define a static string variable nameed `type` in your components.
 *
=======
/**
 * The component interface, every component has to implement.
 *
>>>>>>> Emit alslo the declaration files.
 * @export
 * @interface Component
 */
export interface Component {
}
<<<<<<< HEAD
/**
 * A collection for components.
 * Supports accessing components by their class.
 *
 * @export
 * @class ComponentCollection
 * @extends {Collection<Component>}
 */
export declare class ComponentCollection extends Collection<Component> {
    /**
     * Searches for the first component matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param {ComponentClass<Component> | string} classOrType The class or type a component has to match.
     * @returns {Component} The found component or `null`.
     */
    get(classOrType: ComponentClass<Component> | string): Component;
    /**
     * Searches for the all components matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param {ComponentClass<Component> | string} classOrType The class or type components have to match.
     * @returns {readonly Component[]} A list of all components matching the given class.
     */
    getAll(classOrType: ComponentClass<Component> | string): readonly Component[];
}
=======
>>>>>>> Emit alslo the declaration files.

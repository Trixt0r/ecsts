import { Collection, CollectionListener } from "./collection";
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
export declare class ComponentCollection extends Collection<Component> implements CollectionListener<Component> {
    /**
     * Internal map for faster component access, by class or type.
     *
     * @protected
     */
    protected cache: Map<string | ComponentClass<Component>, readonly Component[]>;
    /**
     * Internal state for updating the components access memory.
     *
     * @protected
     */
    protected dirty: Map<string | ComponentClass<Component>, boolean>;
    constructor(initial?: Component[]);
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onAdded(...elements: Component[]): void;
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onRemoved(...elements: Component[]): void;
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onCleared(): void;
    /**
     * Searches for the first component matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param {ComponentClass<Component> | string} classOrType The class or type a component has to match.
     * @returns {Component} The found component or `null`.
     */
    get<T extends Component>(classOrType: ComponentClass<T> | string): T;
    /**
     * Searches for the all components matching the given class or type.
     *
     * @todo Use caching, to increase access speed
     * @param {ComponentClass<Component> | string} classOrType The class or type components have to match.
     * @returns {readonly Component[]} A list of all components matching the given class.
     */
    getAll<T extends Component>(classOrType: ComponentClass<T> | string): readonly T[];
    /**
     * Updates the cache for the given class or type.
     *
     * @param {ComponentClass<Component> | string} classOrType The class or type to update the cache for.
     * @returns {void}
     */
    protected updateCache<T extends Component>(classOrType: ComponentClass<T> | string): void;
    /**
     * Marks the classes and types of the given elements as dirty,
     * so their cache gets updated on the next request.
     *
     * @param {Component[]} elements
     * @returns {void}
     */
    protected markForCacheUpdate(...elements: Component[]): void;
}

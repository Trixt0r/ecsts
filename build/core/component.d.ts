import { Collection, CollectionListener } from './collection';
import { ComponentClass } from './types';
/**
 * The component interface, every component has to implement.
 *
 * If you want your system to treat different Components the same way,
 * you may define a static string variable named `type` in your components.
 */
export interface Component extends Record<string, any> {
    /**
     * An optional id for the component.
     */
    id?: string;
    /**
     * An optional type for the component.
     */
    type?: string;
}
/**
 * A collection for components.
 * Supports accessing components by their class.
 *
 */
export declare class ComponentCollection<C extends Component = Component> extends Collection<C> implements CollectionListener<C> {
    /**
     * Internal map for faster component access, by class or type.
     */
    protected cache: Map<string | ComponentClass<C>, readonly C[]>;
    /**
     * Internal state for updating the components access memory.
     *
     */
    protected dirty: Map<string | ComponentClass<C>, boolean>;
    constructor(initial?: C[]);
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onAdded(...elements: C[]): void;
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onRemoved(...elements: C[]): void;
    /**
     * @inheritdoc
     * Update the internal cache.
     */
    onCleared(): void;
    /**
     * Searches for the first component matching the given class or type.
     *
     * @param classOrType The class or type a component has to match.
     * @return The found component or `null`.
     */
    get<T extends C>(classOrType: ComponentClass<T> | string): T;
    /**
     * Searches for the all components matching the given class or type.
     *
     * @param classOrType The class or type components have to match.
     * @return A list of all components matching the given class.
     */
    getAll<T extends C>(classOrType: ComponentClass<T> | string): readonly T[];
    /**
     * Updates the cache for the given class or type.
     *
     * @param classOrType The class or type to update the cache for.
     */
    protected updateCache(classOrType: ComponentClass<C> | string): void;
    /**
     * Marks the classes and types of the given elements as dirty,
     * so their cache gets updated on the next request.
     *
     * @param elements
     *
     */
    protected markForCacheUpdate(...elements: C[]): void;
}

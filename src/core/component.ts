import { Collection, CollectionListener } from "./collection";
import { ComponentClass } from "./types";

/**
 * The component interface, every component has to implement.
 *
 * If you want your system to treat different Components the same way,
 * you may define a static string variable named `type` in your components.
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
export class ComponentCollection<C extends Component = Component> extends Collection<C> implements CollectionListener<C> {

  /**
   * Internal map for faster component access, by class or type.
   *
   * @protected
   */
  protected cache = new Map<ComponentClass<C> | string, readonly C[]>();

  /**
   * Internal state for updating the components access memory.
   *
   * @protected
   */
  protected dirty = new Map<ComponentClass<C> | string, boolean>();

  constructor(initial: C[] = []) {
    super(initial);
    this.addListener(this, true);
  }

  /**
   * @inheritdoc
   * Update the internal cache.
   */
  onAdded(...elements: C[]): void {
    this.markForCacheUpdate.apply(this, elements);
  }

  /**
   * @inheritdoc
   * Update the internal cache.
   */
  onRemoved(...elements: C[]): void {
    this.markForCacheUpdate.apply(this, elements);
  }

  /**
   * @inheritdoc
   * Update the internal cache.
   */
  onCleared() {
    this.dirty.clear();
    this.cache.clear();
  }

  /**
   * Searches for the first component matching the given class or type.
   *
   * @todo Use caching, to increase access speed
   * @param {ComponentClass<T> | string} classOrType The class or type a component has to match.
   * @returns {T} The found component or `null`.
   */
  get<T extends C>(classOrType: ComponentClass<T> | string): T {
    return this.getAll(classOrType)[0];
  }

  /**
   * Searches for the all components matching the given class or type.
   *
   * @todo Use caching, to increase access speed
   * @param {ComponentClass<T> | string} classOrType The class or type components have to match.
   * @returns {readonly T[]} A list of all components matching the given class.
   */
  getAll<T extends C>(classOrType: ComponentClass<T> | string): readonly T[] {
    if (this.dirty.get(classOrType)) this.updateCache(classOrType);
    if (this.cache.has(classOrType)) return <T[]>this.cache.get(classOrType);
    this.updateCache(classOrType);
    return <T[]>this.cache.get(classOrType);
  }

  /**
   * Updates the cache for the given class or type.
   *
   * @param {ComponentClass<Component> | string} classOrType The class or type to update the cache for.
   * @returns {void}
   */
  protected updateCache(classOrType: ComponentClass<C> | string): void {
    const keys = this.cache.keys();
    const type = typeof classOrType === 'string' ? classOrType : classOrType.type;
    const filtered = this.filter(element => {
      const clazz = <ComponentClass<C>>element.constructor;
      return type && clazz.type ? type === clazz.type : clazz === classOrType;
    });
    if (typeof classOrType !== 'string' && classOrType.type) {
      this.cache.set(classOrType.type, filtered);
      this.dirty.delete(classOrType.type);
    } else if (typeof classOrType === 'string') {
      for (let key of keys) {
        if (typeof key !== 'string' && key.type === classOrType) {
          this.cache.set(key, filtered);
          this.dirty.delete(key);
        }
      }
    }
    this.cache.set(classOrType, filtered);
    this.dirty.delete(classOrType);
  }

  /**
   * Marks the classes and types of the given elements as dirty,
   * so their cache gets updated on the next request.
   *
   * @param {C[]} elements
   * @returns {void}
   */
  protected markForCacheUpdate(...elements: C[]): void {
    const keys = this.cache.keys();
    elements.forEach(element => {
      const clazz = <ComponentClass<C>>element.constructor;
      const classOrType = clazz.type ? clazz.type : clazz;
      if (this.dirty.get(classOrType)) return;
      if (typeof classOrType !== 'string' && classOrType.type)
        this.dirty.set(classOrType.type, true);
      else if (typeof classOrType === 'string') {
        for (let key of keys) {
          if (typeof key !== 'string' && key.type === classOrType)
            this.dirty.set(key, true);
        }
      }
      this.dirty.set(classOrType, true);
    });
  }

}

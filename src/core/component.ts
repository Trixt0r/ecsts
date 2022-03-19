import { Collection, CollectionListener } from './collection';
import { ComponentClass } from './types';

/**
 * The component interface, every component has to implement.
 *
 * If you want your system to treat different Components the same way,
 * you may define a static string variable named `type` in your components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export class ComponentCollection<C extends Component = Component>
  extends Collection<C>
  implements CollectionListener<C>
{
  /**
   * Internal map for faster component access, by class or type.
   */
  protected cache = new Map<ComponentClass<C> | string, readonly C[]>();

  /**
   * Internal state for updating the components access memory.
   *
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
    this.markForCacheUpdate(...elements);
  }

  /**
   * @inheritdoc
   * Update the internal cache.
   */
  onRemoved(...elements: C[]): void {
    this.markForCacheUpdate(...elements);
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
   * @param classOrType The class or type a component has to match.
   * @return The found component or `null`.
   */
  get<T extends C>(classOrType: ComponentClass<T> | string): T {
    return this.getAll(classOrType)[0];
  }

  /**
   * Searches for the all components matching the given class or type.
   *
   * @param classOrType The class or type components have to match.
   * @return A list of all components matching the given class.
   */
  getAll<T extends C>(classOrType: ComponentClass<T> | string): readonly T[] {
    if (this.dirty.get(classOrType)) this.updateCache(classOrType);
    if (this.cache.has(classOrType)) return this.cache.get(classOrType) as T[];
    this.updateCache(classOrType);
    return this.cache.get(classOrType) as T[];
  }

  /**
   * Updates the cache for the given class or type.
   *
   * @param classOrType The class or type to update the cache for.
   */
  protected updateCache(classOrType: ComponentClass<C> | string): void {
    const keys = this.cache.keys();
    const type = typeof classOrType === 'string' ? classOrType : classOrType.type;
    const filtered = this.filter(element => {
      const clazz = element.constructor as ComponentClass<C>;
      const typeVal = element.type ?? clazz.type;
      return type && typeVal ? type === typeVal : clazz === classOrType;
    });
    if (typeof classOrType !== 'string' && classOrType.type) {
      this.cache.set(classOrType.type, filtered);
      this.dirty.delete(classOrType.type);
    } else if (typeof classOrType === 'string') {
      for (const key of keys) {
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
   * @param elements
   *
   */
  protected markForCacheUpdate(...elements: C[]): void {
    const keys = this.cache.keys();
    elements.forEach(element => {
      const clazz = element.constructor as ComponentClass<C>;
      const classOrType = element.type ?? clazz.type ?? clazz;
      if (this.dirty.get(classOrType)) return;
      if (typeof classOrType === 'string') {
        for (const key of keys) {
          if (typeof key !== 'string' && key.type === classOrType) this.dirty.set(key, true);
        }
      }
      this.dirty.set(classOrType, true);
    });
  }
}

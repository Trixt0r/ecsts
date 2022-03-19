import { Collection, CollectionListener } from './collection';
import { AbstractEntity } from './entity';

export class EntityCollection<T extends AbstractEntity = AbstractEntity>
  extends Collection<T>
  implements CollectionListener<T>
{
  /**
   * Internal map for faster entity access, by id.
   */
  protected cache = new Map<number | string, T>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]) {
    super(...args);
    this.addListener(this, true);
  }

  /**
   * Returns the entity for the given id in this collection.
   *
   * @param id The id to search for.
   * @return The found entity or `undefined` if not found.
   */
  get(id: string | number): T | undefined {
    return this.cache.get(id);
  }

  /**
   * @inheritdoc
   */
  onAdded(...entities: T[]): void {
    for (let i = 0, l = entities.length; i < l; i++) this.cache.set(entities[i].id, entities[i]);
  }

  /**
   * @inheritdoc
   */
  onRemoved(...entities: T[]): void {
    for (let i = 0, l = entities.length; i < l; i++) this.cache.delete(entities[i].id);
  }

  /**
   * @inheritdoc
   */
  onCleared(): void {
    this.cache.clear();
  }
}

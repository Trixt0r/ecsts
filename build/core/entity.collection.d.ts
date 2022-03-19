import { Collection, CollectionListener } from './collection';
import { AbstractEntity } from './entity';
export declare class EntityCollection<T extends AbstractEntity = AbstractEntity> extends Collection<T> implements CollectionListener<T> {
    /**
     * Internal map for faster entity access, by id.
     */
    protected cache: Map<string | number, T>;
    constructor(...args: any[]);
    /**
     * Returns the entity for the given id in this collection.
     *
     * @param id The id to search for.
     * @return The found entity or `undefined` if not found.
     */
    get(id: string | number): T | undefined;
    /**
     * @inheritdoc
     */
    onAdded(...entities: T[]): void;
    /**
     * @inheritdoc
     */
    onRemoved(...entities: T[]): void;
    /**
     * @inheritdoc
     */
    onCleared(): void;
}

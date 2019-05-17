import { Component } from "index";

interface Type<T> extends Function {
  new (...args: any[]): T;
}

/**
 * A Filter holds a unique id for a certain combination of component types.
 * Use @see {Filter#get} to obtain a filter for a list of components.
 *
 * @export
 * @class Filter
 */
export class Filter {

  /**
   * The internal cache for filter instances.
   *
   * @protected
   * @static
   * @type {{ [id: string]: Filter }}
   */
  protected static cache: Filter[];

  /**
   * The id of this filter.
   *
   * @type {number}
   */
  readonly id: number;

  /**
   * Creates an instance of Filter.
   *
   * @param {Type<Component>[]} types
   */
  protected constructor(public readonly types: readonly Type<Component>[]) {
    this.id = Filter.cache.length;
  }

  /**
   * Returns a filter for the given combination of component types.
   *
   * @param {Type<Component>[]} types
   * @returns {Filter}
   */
  static get(...types: Type<Component>[]): Filter {
    const found = Filter.cache.find(filter => {
      if (filter.types.length !== types.length) return false;
      const filtered = types.filter(type => filter.types.indexOf(type) >= 0);
      return filtered.length === types.length;
    });
    if (!found) {
      const filter = new Filter(types);
      Filter.cache[filter.id] = filter;
      return filter;
    } else {
      return found;
    }
  }

}

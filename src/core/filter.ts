import { Component } from "index";

interface Type<T> extends Function {
  new (...args: any[]): T;
}

/**
 * Creates an id for the given length.
 *
 * @param {number} [length=8]
 * @returns {string}
 */
function makeId(length = 8): string {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * A Filter holds a unique id for a certain combination of component types.
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
  protected static cache: { [id: string]: Filter } = { };

  /**
   * The id of this filter.
   *
   * @type {string}
   */
  readonly id: string;

  /**
   * Creates an instance of Filter.
   *
   * @param {Type<Component>[]} types
   */
  protected constructor(public readonly types: readonly Type<Component>[]) {
    this.id = makeId();
  }

  /**
   * Returns a filter for the given combination of component types.
   *
   * @param {Type<Component>[]} types
   * @returns {Filter}
   */
  static get(...types: Type<Component>[]): Filter {
    const keys = Object.keys(Filter.cache);
    const found = keys.find(key => {
      const filter = Filter.cache[key];
      if (filter.types.length !== types.length) return false;
      const filtered = types.filter(type => filter.types.indexOf(type) >= 0);
      return filtered.length === types.length;
    });
    if (!found) {
      const filter = new Filter(types);
      Filter.cache[filter.id] = filter;
      return filter;
    } else {
      return Filter.cache[found];
    }
  }

}

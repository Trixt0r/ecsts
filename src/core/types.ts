export type ArgumentTypes<F> = F extends (...args: infer A) => any ? A : never;
export interface Class<T> extends Function {
  new (...args: any[]): T;
}

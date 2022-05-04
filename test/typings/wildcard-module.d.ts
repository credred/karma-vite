/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'di' {
  export class Injector {
    get<T = any>(dep: string): T;
    invoke<T, C>(fn: (this: C, ...deps: any[]) => T, context?: C): T;
    instantiate<T>(fn: (...deps: any[]) => T): T;
    createChild(modules: any[]): Injector;
    constructor(modules?: any[], parent?: Injector);
  }
}

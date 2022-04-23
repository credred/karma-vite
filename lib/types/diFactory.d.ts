import type { CreateTupleByLength } from './utils';

export interface DiFactory<T extends unknown[] = void[], R = unknown> {
  (...args: T): R;
  $inject: CreateTupleByLength<string, T['length']>;
}

export type CreateTupleByLength<
  T,
  L,
  R extends unknown[] = [],
> = R['length'] extends L ? R : CreateTupleByLength<T, L, [T, ...R]>;

export type AugmentedRequired<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

import { queryOptions } from "@tanstack/react-query";

// Infer output from any function returning a Promise
type InferOutput<T> = T extends (...args: never[]) => Promise<infer O> ? O : never;

// Infer input from function that takes { data: T } as first argument property
type InferInput<T> = T extends (opts: infer Opts) => Promise<unknown>
  ? Opts extends { data: infer I }
    ? I
    : never
  : never;

// Use a minimal callable interface for the constraint
interface Callable {
  // biome-ignore lint/suspicious/noExplicitAny: Required for proper type inference from TanStack server functions
  (...args: any[]): Promise<unknown>;
}

function createQueryProcedure<TFn extends () => Promise<unknown>>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    query: () => serverFn() as Promise<InferOutput<TFn>>,
    queryOptions: () =>
      queryOptions({
        queryKey: path,
        queryFn: () => serverFn() as Promise<InferOutput<TFn>>,
      }),
    queryKey: () => path,
  };
}

function createQueryProcedureWithInput<TFn extends Callable>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    query: (input: InferInput<TFn>) =>
      serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
    queryOptions: (input: InferInput<TFn>) =>
      queryOptions({
        queryKey: [...path, input],
        queryFn: () => serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
      }),
    queryKey: (input?: InferInput<TFn>) =>
      input !== undefined ? ([...path, input] as const) : path,
  };
}

function createMutationProcedure<TFn extends () => Promise<unknown>>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    mutate: () => serverFn() as Promise<InferOutput<TFn>>,
    mutationKey: () => path,
  };
}

function createMutationProcedureWithInput<TFn extends Callable>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    mutate: (input: InferInput<TFn>) =>
      serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
    mutationKey: () => path,
  };
}

export {
  createQueryProcedure,
  createQueryProcedureWithInput,
  createMutationProcedure,
  createMutationProcedureWithInput,
};

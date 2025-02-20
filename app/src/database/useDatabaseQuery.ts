import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { DatabaseContext } from "./DatabaseContext";
import { Database } from "./database";

type UnwrapPromise<T> = T extends Promise<infer C> ? C : never;

type AsyncMethodNames<T> = {
  [M in keyof T]: T[M] extends (...args: any[]) => Promise<any> ? M : never;
}[keyof T];

interface DbStore<T> {
  subscribe<M extends AsyncMethodNames<T>>(
    m: M,
  ): (listener: () => void) => () => void;
  getSnapshot<M extends AsyncMethodNames<T>>(
    m: M,
  ): T[M] extends (...args: any[]) => any
    ? UnwrapPromise<ReturnType<T[M]>>
    : never;
}

interface FooDb {
  fetchFoo(): Promise<{ a: number }>;
  fetchBar(): Promise<{ a: number }>;
}

type Foo = DbStore<FooDb>;

type Bar = Foo["getSnapshot"];

const foo: Foo = {} as any;

const res = foo.getSnapshot("fetchFoo");

console.log(res);
type X = Bar;

class DatabaseStore<T> extends DbStore<T> {
  private _listeners: Map<string, Set<() => void>> = new Map();
  private _cache: Map<string, any> = new Map();

  private _listenMethods = Map<string>;

  listen(methodName: any) {
    return (listener: () => void) => {
      this._listeners.add(listener);

      return () => {
        this._listeners.delete(listener);
      };
    };
  }

  getSnapshot(methodName: any) {}
}

// function createDatabaseStore<T>(db: T): DbStore<T> {
//
// }

const store = createDatabaseStore(db);

store.listen("findBendchmarks");
store.getSnapshot("findBenchmarks");

export function useDatabaseQuery<T extends AsyncMethodNames<Database>>(
  methodName: T,
): ReturnType<Database[T]> {
  const db = useContext(DatabaseContext);

  if (!db) {
    return;
  }

  return useSyncExternalStore(
    store.listen(methodName),
    store.getSnapshot[methodName](),
  );

  const [cb, setCb] = useState<{
    value: ((...params: Parameters<Database[T]>) => void) | null;
  }>({ value: null });

  useEffect(() => {
    if (!db) {
      return;
    }

    setCb({
      value: (...params) => {
        // need to cast to any as typescript cannot infer ...params
        // eslint-disable-next-line
        return (db[asyncMethodName] as any)(...params);
      },
    });
  }, [methodName, db, setCb]);

  return (
    cb.value ??
    (() => {
      return;
    })
  );
}

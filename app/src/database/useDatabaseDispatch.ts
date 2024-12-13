import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "./DatabaseContext";
import { Database } from "./database";

type MethodNames<T> = {
  [M in keyof T]: T[M] extends (...args: unknown[]) => unknown ? M : never;
}[keyof T];

export function useDatabaseDispatch<T extends MethodNames<Database>>(
  methodName: T,
): (...params: Parameters<Database[T]>) => void {
  const [cb, setCb] = useState<{
    value: ((...params: Parameters<Database[T]>) => void) | null;
  }>({ value: null });
  const db = useContext(DatabaseContext);

  useEffect(() => {
    if (!db) {
      return;
    }

    setCb({
      value: (...params) => {
        // need to cast to any as typescript cannot infer ...params
        // eslint-disable-next-line
        return (db[methodName] as any)(...params);
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

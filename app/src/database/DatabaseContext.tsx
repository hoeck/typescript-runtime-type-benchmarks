import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { Database } from "./database";

export const DatabaseContext = createContext<Database | null>(null);

export function DatabaseContextProvider(props: PropsWithChildren) {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    if (db) {
      return;
    }

    Database.create()
      .then(async (conn) => {
        await conn.fetchResults();
        setDb(conn);
      })
      .catch(console.error);

    return () => {
      db!?.close();
    };
  });

  return (
    <DatabaseContext.Provider value={db}>
      {props.children}
    </DatabaseContext.Provider>
  );
}

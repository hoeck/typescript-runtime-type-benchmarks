import { createContext, PropsWithChildren, useEffect, useState } from "react";
import { Database } from "./database";

export const DatabaseContext = createContext<Database | null>(null);

export function DatabaseContextProvider(props: PropsWithChildren) {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    if (db) {
      return () => {
        void db.close();
      };
    }

    Database.create()
      .then((conn) => {
        // fetch results lazily
        // TODO: move this init code outside of the db contextprovider
        conn.fetchResults().catch((e: unknown) => {
          console.error(e);
        });

        setDb(conn);
      })
      .catch((e: unknown) => {
        console.error(e);
      });

    return;
  }, [db]);

  return (
    <DatabaseContext.Provider value={db}>
      {props.children}
    </DatabaseContext.Provider>
  );
}

import { useContext, useEffect, useState } from "react";
import { DatabaseContext } from "./DatabaseContext";
import { Database } from "./database";

export function useDatabase<T>(
  callback: (db: Database) => Promise<T>,
  dependencies?: readonly unknown[],
): T | null {
  const [result, setResult] = useState<T | null>(null);
  const db = useContext(DatabaseContext);

  useEffect(() => {
    if (!db) {
      return;
    }

    callback(db)
      .then((r) => setResult(r))
      .catch((err) => {
        setResult(null);
        console.error(err);
      });
  }, [db?.getLastUpdateTimestamp(), ...(dependencies ? dependencies : [])]);

  return result;
}

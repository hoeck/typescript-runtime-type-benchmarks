import { useEffect, useState } from "react";
import "./App.css";
import { Result, ResultDatabase } from "./benchmarkResults";

function App() {
  const [resultDb, setResultDb] = useState<ResultDatabase | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const init = async () => {
      const db = await ResultDatabase.create();

      await db.fetchResults();

      setResultDb(db);
    };

    init().catch(console.error);

    return () => {
      resultDb?.close();
    };
  }, []);

  useEffect(() => {
    resultDb
      ?.findResults()
      .then((res) => setResults(res))
      .catch(console.error);
  }, [resultDb]);

  return (
    <>
      <h1>sqlite</h1>

      <table>
        <thead>
          <tr>
            <th>benchmark</th>
            <th>name</th>
            <th>ops</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i}>
              <td>{r.benchmark}</td>
              <td>{r.name}</td>
              <td>{r.ops}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default App;

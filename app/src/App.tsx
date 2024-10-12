import "./App.css";
import { DatabaseContextProvider, useDatabase } from "./database";

function ResultsTable() {
  const results = useDatabase((db) => {
    return db.findResults();
  });

  return (
    <table>
      <thead>
        <tr>
          <th>benchmark</th>
          <th>name</th>
          <th>ops</th>
        </tr>
      </thead>
      <tbody>
        {results?.map((r, i) => (
          <tr key={i}>
            <td>{r.benchmark}</td>
            <td>{r.name}</td>
            <td>{r.ops}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function App() {
  return (
    <DatabaseContextProvider>
      <h1>sqlite</h1>
      <ResultsTable />
    </DatabaseContextProvider>
  );
}

export default App;

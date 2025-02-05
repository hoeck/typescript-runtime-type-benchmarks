import { AppShell, Group, MantineProvider, rem } from "@mantine/core";
import "@mantine/core/styles.css";
import "./App.css";
import { Filter } from "./components/Filter";
import { Graph } from "./components/Graph";
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
      <MantineProvider>
        <AppShell header={{ height: 60, offset: false }} padding="md">
          <AppShell.Header>
            <Group h="100%" px="md">
              <h1>Benchmark</h1>
            </Group>
          </AppShell.Header>

          <AppShell.Main pt={`calc(${rem(60)} + var(--mantine-spacing-md))`}>
            <Filter />
            <Graph />
            <h1>Results</h1>
            <ResultsTable />
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </DatabaseContextProvider>
  );
}

export default App;

import { Checkbox, Stack } from "@mantine/core";
import { useDatabase, useDatabaseDispatch } from "../database";

function BenchmarksFilter() {
  const benchmarks = useDatabase((db) => {
    return db.findBenchmarks();
  });
  const setFilter = useDatabaseDispatch("setBenchmarkSelected");

  return (
    <Stack gap="xs">
      {benchmarks?.map((b) => (
        <Checkbox
          key={b.id}
          label={b.name}
          checked={!!b.selected}
          onChange={(ev) => {
            setFilter(b.id, !ev.currentTarget.checked);
          }}
        />
      ))}
    </Stack>
  );
}

export function Filter() {
  return (
    <div>
      <BenchmarksFilter />
    </div>
  );
}

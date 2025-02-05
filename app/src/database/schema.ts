export const schema = `

CREATE TABLE results (
  runtime_id INT NOT NULL,
  benchmark_id INT NOT NULL,
  module_id INT NOT NULL,
  ops INT NOT NULL,
  margin REAL NOT NULL,
  FOREIGN KEY(runtime_id) REFERENCES runtimes(id),
  FOREIGN KEY(benchmark_id) REFERENCES benchmarks(id),
  FOREIGN KEY(module_id) REFERENCES modules(id),
  UNIQUE(runtime_id, benchmark_id, module_id)
) STRICT;

CREATE TABLE runtimes (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 1,
  UNIQUE(name, version)
) STRICT;

CREATE TABLE benchmarks (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  selected INTEGER NOT NULL DEFAULT 1,
  UNIQUE(name)
) STRICT;

CREATE TABLE modules (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  UNIQUE(name)
)
`;

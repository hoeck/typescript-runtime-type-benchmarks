import { Database as SqliteDatabase } from "./sqlite";

const createResultsTable = `
CREATE TABLE results (
  benchmark TEXT NOT NULL,
  name TEXT NOT NULL,
  ops INT NOT NULL,
  margin REAL NOT NULL,
  runtime TEXT NOT NULL,
  runtime_version TEXT NOT NULL
) STRICT
`;

export interface Result {
  benchmark: string;
  name: string;
  ops: number;
  margin: number;
  runtime: string;
  runtimeVersion: string;
}

export class Database {
  static async create() {
    const db = await SqliteDatabase.create();

    await db.query(createResultsTable);

    return new Database(db);
  }

  // timestamp of last update
  private _lastUpdate: number;

  constructor(private _db: SqliteDatabase) {
    this._db = _db;
    this._lastUpdate = 0;
  }

  private async _insertResults(results: Result[]) {
    const all: Promise<unknown>[] = [];

    results.forEach((r) => {
      all.push(
        this._db.query(
          "INSERT INTO results VALUES (:benchmark, :name, :ops, :margin, :runtime, :runtimeVersion)",
          {
            ":benchmark": r.benchmark,
            ":name": r.name,
            ":ops": r.ops,
            ":margin": r.margin,
            ":runtime": r.runtime,
            ":runtimeVersion": r.runtimeVersion,
          },
        ),
      );
    });

    await Promise.all(all);

    this._lastUpdate = Date.now();
  }

  async close() {
    await this._db.close();
  }

  getLastUpdateTimestamp(): number {
    return this._lastUpdate;
  }

  async fetchResults() {
    const data = await import("./exampleData");

    this._insertResults(data.results);
  }

  async findResults(): Promise<Result[]> {
    const res = await this._db.query(
      "SELECT " +
        "  benchmark," +
        "  name," +
        "  ops," +
        "  margin," +
        "  runtime," +
        '  runtime_version as "runtimeVersion" ' +
        "FROM " +
        "  results " +
        "WHERE " +
        "  benchmark IN (:benchmark1, :benchmark2) " +
        "ORDER BY " +
        "  benchmark ASC," +
        "  ops DESC," +
        "  name ASC",
      { ":benchmark1": "assertStrict", ":benchmark2": "assertLoose" },
    );

    return res as Result[];
  }
}

// Without using runtypes, an orm or query-generator, we need to use any on
// the db results and trust our SQL-skills.
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Database as SqliteDatabase } from "./sqlite";
import { schema } from "./schema";

export interface Result {
  benchmark: string;
  name: string;
  ops: number;
  margin: number;
  runtime: string;
  runtimeVersion: string;
}

// colors taken from https://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
export const COLORS = [
  "#8dd3c7",
  // '#ffffb3', not this one .. looks too bright to me
  "#bebada",
  "#fb8072",
  "#80b1d3",
  "#fdb462",
  "#b3de69",
  "#fccde5",
  "#d9d9d9",
  "#bc80bd",
  "#ccebc5",
  "#ffed6f",
];

// create a stable color list
export const BENCHMARKS = [
  { name: "parseSafe", label: "Safe Parsing", color: COLORS[0], order: "0" },
  {
    name: "parseStrict",
    label: "Strict Parsing",
    color: COLORS[1],
    order: "1",
  },
  {
    name: "assertLoose",
    label: "Loose Assertion",
    color: COLORS[2],
    order: "2",
  },
  {
    name: "assertStrict",
    label: "Strict Assertion",
    color: COLORS[3],
    order: "3",
  },
];

export class Database {
  static async create() {
    const db = await SqliteDatabase.create();

    await db.query(schema);

    return new Database(db);
  }

  // timestamp of last update
  private _updateCallbacks: ((timestamp: number) => void)[] = [];

  constructor(private _db: SqliteDatabase) {
    this._db = _db;
  }

  private _notifyUpdateCallbacks() {
    const ts = Date.now();

    this._updateCallbacks.forEach((cb) => {
      cb(ts);
    });
  }

  private async _insertResults(results: Result[]) {
    for (const r of results) {
      // runtime upsert
      await this._db.query(
        "INSERT OR IGNORE INTO runtimes (name, version) VALUES (:name, :version)",
        {
          ":name": r.runtime,
          ":version": r.runtimeVersion,
        },
      );
      const [{ id: runtimeId }] = await this._db.query(
        "SELECT id FROM runtimes WHERE name = :name AND version = :version",
        {
          ":name": r.runtime,
          ":version": r.runtimeVersion,
        },
      );

      // benchmark upsert
      await this._db.query(
        "INSERT OR IGNORE INTO benchmarks (name) VALUES (:name)",
        {
          ":name": r.benchmark,
        },
      );
      const [{ id: benchmarkId }] = await this._db.query(
        "SELECT id FROM benchmarks WHERE name = :name",
        {
          ":name": r.benchmark,
        },
      );

      // module upsert
      await this._db.query(
        "INSERT OR IGNORE INTO modules (name) VALUES (:name)",
        {
          ":name": r.name,
        },
      );
      const [{ id: moduleId }] = await this._db.query(
        "SELECT id FROM modules WHERE name = :name",
        {
          ":name": r.name,
        },
      );

      // result
      await this._db.query(
        "INSERT INTO results " +
          "  (runtime_id, benchmark_id, module_id, ops, margin) " +
          "VALUES " +
          "  (:runtimeId, :benchmarkId, :moduleId, :ops, :margin)",
        {
          ":runtimeId": runtimeId,
          ":benchmarkId": benchmarkId,
          ":moduleId": moduleId,
          ":ops": r.ops,
          ":margin": r.margin,
        },
      );
    }

    this._notifyUpdateCallbacks();
  }

  async close() {
    await this._db.close();
  }

  addUpdateCallback(handler: (timestamp: number) => void) {
    return this._updateCallbacks.push(handler);
  }

  removeUpdateCallback(handler: (timestamp: number) => void) {
    return (this._updateCallbacks = this._updateCallbacks.filter(
      (h) => h !== handler,
    ));
  }

  async fetchResults() {
    const data = await import("./exampleData");

    await this._insertResults(data.results);
  }

  async findBenchmarks(): Promise<
    {
      id: number;
      name: string;
      selected: 0 | 1;
    }[]
  > {
    return (await this._db.query(
      "SELECT id, name, selected FROM benchmarks",
    )) as any;
  }

  async findRuntimes(): Promise<{
    id: number;
    name: string;
    version: string;
    selected: 0 | 1;
  }> {
    return (await this._db.query(
      "SELECT id, name, version, selected FROM runtimes",
    )) as any;
  }

  async findSortedModuleNames(): Promise<string[]> {
    return (
      await this._db.query("SELECT name FROM modules ORDER BY name ASC")
    ).map((row) => row.name);
  }

  async getSelectedRuntimeCount(): Promise<number> {
    return (
      await this._db.query(
        "SELECT count(*) AS cnt FROM runtimes WHERE selected",
      )
    )[0].cnt;
  }

  async setBenchmarkSelected(
    benchmarkId: number,
    selected: boolean,
  ): Promise<void> {
    await this._db.query(
      "UPDATE benchmarks SET selected = :selected WHERE id = :benchmarkId",
      {
        ":benchmarkId": benchmarkId,
        ":selected": selected ? 0 : 1,
      },
    );
    this._notifyUpdateCallbacks();
  }

  async setRuntimeSelected(
    runtimeId: number,
    selected: boolean,
  ): Promise<void> {
    await this._db.query(
      "UPDATE runtimes SET selected = :selected WHERE id = :runtimeId",
      {
        ":runtimeId": runtimeId,
        ":selected": selected ? 0 : 1,
      },
    );
    this._notifyUpdateCallbacks();
  }

  async findResults(): Promise<Result[]> {
    const res = await this._db.query(`
      SELECT
        m.name AS name,
        r.name AS runtime,
        r.version AS runtimeVersion,
        b.name AS benchmark,
        COALESCE(rs.ops, 0) AS ops
      FROM modules m
      CROSS JOIN runtimes r
      CROSS JOIN benchmarks b
      LEFT JOIN results rs ON (rs.benchmark_id = b.id AND rs.runtime_id = r.id AND rs.module_id = m.id)
      WHERE r.selected AND b.selected
      ORDER BY
        name ASC,
        benchmark ASC,
        runtime ASC,
        runtimeVersion ASC
    `);

    return res as Result[];
  }
}

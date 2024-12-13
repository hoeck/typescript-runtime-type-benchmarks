import { sqlite3Worker1Promiser, Promiser } from "@sqlite.org/sqlite-wasm";

// sqlite wrapper is only barely typed so I need to use lots of anys
/* eslint-disable */

export class Database {
  static async create(): Promise<Database> {
    const promiser = await new Promise<Promiser>((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser),
      });
    });

    await promiser("open", {
      // or ":memory" ?? opfs does not work as we cannot instruct github to
      // send the necessary headers and also we don't need the database to be
      // persistent anyways
      filename: "",
    });

    return new Database(promiser);
  }

  constructor(private _promiser: Promiser) {
    this._promiser = _promiser;
  }

  async close() {
    await this._promiser("close", {});
  }

  async query(sqlString: string, params?: any) {
    let rows: Record<string, any>[] = [];

    return new Promise<typeof rows>((resolve, reject) => {
      this._promiser("exec", {
        sql: sqlString,
        bind: params,

        // weird, chatty, a single message for each row - seems quite inefficient
        // maybe its the most basic thing to implement given sqlite internals?
        callback: (res) => {
          if (res.rowNumber === null && res.row === undefined) {
            // terminates the query result
            // https://sqlite.org/wasm/doc/trunk/api-worker1.md#worker1-methods
            resolve(rows);
          } else {
            // sqlite row numbers seem to be 1-based
            rows[res.rowNumber - 1] = Object.fromEntries(
              res.columnNames.map((columnName, columnIndex) => [
                columnName,
                res.row[columnIndex],
              ]),
            );
          }
        },
      }).catch((err: any) => {
        if (
          !err ||
          typeof err !== "object" ||
          err.type !== "error" ||
          typeof err.dbId !== "string" ||
          typeof err.result?.message !== "string" ||
          err.result?.errorClass !== "SQLite3Error"
        ) {
          // not an sqlite error
          const wrappedError: any = new Error(
            "Error while executing query " +
              JSON.stringify(sqlString) +
              ":" +
              err?.message,
          );

          wrappedError.query = sqlString;
          wrappedError.queryParams = params;
          wrappedError.sqliteError = err;

          reject(wrappedError);
        }

        // sqlite error
        const wrappedError: any = new Error(
          "Sqlite Error while executing query " +
            JSON.stringify(sqlString) +
            ":" +
            err.result.message,
        );

        wrappedError.query = sqlString;
        wrappedError.queryParams = params;
        wrappedError.sqliteError = err;

        reject(wrappedError);
      });
    });
  }
}

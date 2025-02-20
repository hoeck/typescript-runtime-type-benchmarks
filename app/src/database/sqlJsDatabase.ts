const initSqlJs = require("sql.js");
import sqlWasmWasm from "sql.js/dist/sql-wasm.wasm";

async function test() {
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file !== "sql-wasm.wasm") {
        console.error("expected file to be 'sql-wasm.wasm', not:", file);
      }

      return sqlWasmWasm;
    },
  });

  // Create a database
  const db = new SQL.Database();

  await db.exec("CREATE TABLE foo (id, value, name, lab)");
  await db.exec("CREATE TABLE BAR (id, foo_id)");
  await db.exec(
    "INSERT INTO foo (id, value, name, lab) VALUES (1, 'a', 'x', 'y'), (2, 'b', 'p', 'q')",
  );
  await db.exec("INSERT INTO bar (id, foo_id) VALUES (1, 2)");

  // const res = await db.exec("SELECT * FROM foo");

  // db.updateHook((...args: any[]) => {
  //   console.log("update", args);
  // });

  // await db.exec("INSERT INTO foo (id, value) VALUES (3, 'c')");

  // console.log(res);

  const stmt = db.prepare(
    "EXPLAIN query plan SELECT id, lab FROM (select* from foo) f WHERE id IN (select foo_id from bar)",
  );

  console.log(
    "STATEMENT",
    Object.keys(stmt.__proto__).filter((k) => k.length > 2),
  );

  console.log(stmt.getColumnNames());
  console.log(stmt.getNormalizedSQL());
  // console.log(stmt.getAsObject());
  console.log(stmt.getColumnOriginNames());

  // //stmt.bind(["x"]);
  // console.log(stmt.getAsObject());

  while (stmt.step()) console.log(stmt.get());
}

test()
  .then(() => console.log("test done"))
  .catch((e) => console.error(e));

import { readFile } from "fs/promises";

import path from "path";

import { pool } from "../config/database";



async function run() {

  try {

    const migrations = [

      "003_add_avatar_columns.sql"

    ];



    for (const migration of migrations) {

      const sqlPath = path.join(

        __dirname,

        "..",

        "..",

        "migrations",

        migration,

      );



      console.log(`Running migration: ${migration}`);

      console.log("Running migrations from", sqlPath);

      const sql = await readFile(sqlPath, "utf8");

      await pool.query(sql);

      console.log(`✅ Applied ${migration}`);

    }



    console.log("✅ All migrations applied");

    process.exit(0);

  } catch (err) {

    console.error("❌ Migration error", err);

    process.exit(1);

  }

}



run();
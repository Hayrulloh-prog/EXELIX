import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

const argv = require("minimist")(process.argv.slice(2));

async function run() {
  const username = argv.username || process.env.ADMIN_USERNAME || argv.u;
  const password = argv.password || process.env.ADMIN_PASSWORD || argv.p;

  if (!username || !password) {
    console.error(
      "Usage: tsx src/seeds/createAdmin.ts --username=admin --password=pass",
    );
    process.exit(1);
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await query(
      `INSERT INTO admins (id, username, password_hash) VALUES ($1, $2, $3)`,
      [id, username, hashed],
    );
    console.log("Admin created:", username);
    process.exit(0);
  } catch (err: any) {
    console.error("Error creating admin:", err.message || err);
    process.exit(1);
  }
}

run();

// db.js
// db.js
require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL env var.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  close: () => pool.end(),
};

// test.js
const db = require('./db');

async function testConnection() {
  try {
    const res = await db.query('SELECT NOW()'); // Asks Postgres for the current time
    console.log('Connection Successful! Database time:', res.rows[0].now);
  } catch (err) {
    console.error('Connection Error:', err);
  }
}

testConnection();
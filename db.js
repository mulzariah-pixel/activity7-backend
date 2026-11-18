// db.js
// Database connection and query interface (supports PostgreSQL and SQLite fallback)

require("dotenv").config();
const fs = require("fs");
const path = require("path");

let pool;

if (process.env.DATABASE_URL) {
  // Production / PostgreSQL mode (e.g. Render PostgreSQL)
  const { Pool } = require("pg");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false }
  });

  // Ensure table and seed records exist
  (async () => {
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
      await pool.query(schemaSql);

      const countRes = await pool.query("SELECT COUNT(*) AS count FROM records");
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        const seedSql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
        await pool.query(seedSql);
        console.log("PostgreSQL: Initial records seeded.");
      }
    } catch (err) {
      console.error("PostgreSQL initialization error:", err.message);
    }
  })();
} else {
  // Local development fallback using SQLite
  const sqlite3 = require("sqlite3").verbose();
  const dbFile = path.join(__dirname, "records.db");
  const sqliteDb = new sqlite3.Database(dbFile);

  // Initialize SQLite schema and initial seed
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);

    sqliteDb.get("SELECT COUNT(*) AS count FROM records", (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = sqliteDb.prepare(
          "INSERT INTO records (title, category, description, status) VALUES (?, ?, ?, ?)"
        );
        const seeds = [
          ["Broken fluorescent light fixture", "Electrical", "The ceiling fluorescent tube in Lecture Hall 2 flickers constantly and makes a buzzing sound.", "Pending"],
          ["Leaking faucet in washroom", "Plumbing", "The cold water tap in the 2nd floor Engineering block restroom leaks heavily when turned off.", "In progress"],
          ["Damaged study desk in Library", "Furniture", "Desk number 14 has a broken leg and wobbles severely, making it unsafe for student use.", "Pending"],
          ["Air conditioner failure in Lab 3", "Electrical", "The main split-unit AC in Computer Lab 3 is blowing warm air and showing error code E4.", "In progress"],
          ["Blocked drain outside Cafeteria", "Plumbing", "Rainwater drain next to the main cafeteria entrance is blocked by debris causing flooding.", "Completed"],
          ["Broken whiteboard frame in Room B12", "Furniture", "The mounting bracket on the left side of the whiteboard has detached from the wall.", "Pending"],
          ["Loose power socket at study pod", "Electrical", "The wall outlet near Pod 4 is loose and sparks intermittently when laptop chargers are plugged in.", "Completed"],
          ["Damaged auditorium seat hinge", "Furniture", "Seat 45 in Row F cannot stay folded and the armrest has cracked off.", "Pending"]
        ];
        seeds.forEach(s => stmt.run(s));
        stmt.finalize();
        console.log("SQLite: 8 initial records seeded.");
      }
    });
  });

  // Adapter providing pool.query interface compatible with pg
  pool = {
    query(sql, params = []) {
      return new Promise((resolve, reject) => {
        const trimmed = sql.trim();
        const upper = trimmed.toUpperCase();

        // Convert PostgreSQL $1, $2, ... to SQLite ?
        const sqliteSql = trimmed
          .replace(/\$\d+/g, "?")
          .replace(/RETURNING\s+\*/i, "")
          .replace(/RETURNING\s+id/i, "")
          .trim();

        if (upper.startsWith("SELECT")) {
          sqliteDb.all(sqliteSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve({ rows: rows || [], rowCount: (rows || []).length });
          });
        } else if (upper.startsWith("INSERT")) {
          sqliteDb.run(sqliteSql, params, function (err) {
            if (err) return reject(err);
            const insertedId = this.lastID;
            sqliteDb.get("SELECT * FROM records WHERE id = ?", [insertedId], (gErr, row) => {
              if (gErr) return reject(gErr);
              resolve({ rows: [row], rowCount: 1 });
            });
          });
        } else if (upper.startsWith("UPDATE")) {
          sqliteDb.run(sqliteSql, params, function (err) {
            if (err) return reject(err);
            const changes = this.changes;
            if (changes === 0) {
              return resolve({ rows: [], rowCount: 0 });
            }
            // The id is the last parameter in UPDATE ... WHERE id = $5
            const id = params[params.length - 1];
            sqliteDb.get("SELECT * FROM records WHERE id = ?", [id], (gErr, row) => {
              if (gErr) return reject(gErr);
              resolve({ rows: row ? [row] : [], rowCount: changes });
            });
          });
        } else if (upper.startsWith("DELETE")) {
          sqliteDb.run(sqliteSql, params, function (err) {
            if (err) return reject(err);
            const changes = this.changes;
            const id = params[0];
            resolve({ rows: changes > 0 ? [{ id }] : [], rowCount: changes });
          });
        } else {
          // DDL statements
          sqliteDb.run(sqliteSql, params, function (err) {
            if (err) return reject(err);
            resolve({ rows: [], rowCount: this.changes });
          });
        }
      });
    }
  };
}

module.exports = pool;

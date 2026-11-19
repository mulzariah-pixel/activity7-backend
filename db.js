// db.js
// Database connection and query interface
// Supports PostgreSQL (via pg) when DATABASE_URL is set, and pure-JS persistent storage fallback.

require("dotenv").config();
const fs = require("fs");
const path = require("path");

let pool;

if (process.env.DATABASE_URL) {
  // Production PostgreSQL mode (Render PostgreSQL / Neon / Supabase)
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
  // Pure JavaScript persistent storage (Zero GLIBC / zero native dependencies)
  // Perfectly compatible with Render Free Linux and local environments
  const dataFile = path.join(__dirname, "records.json");

  const INITIAL_SEEDS = [
    {
      id: 1,
      title: "Broken fluorescent light fixture",
      category: "Electrical",
      description: "The ceiling fluorescent tube in Lecture Hall 2 flickers constantly and makes a buzzing sound.",
      status: "Pending"
    },
    {
      id: 2,
      title: "Leaking faucet in washroom",
      category: "Plumbing",
      description: "The cold water tap in the 2nd floor Engineering block restroom leaks heavily when turned off.",
      status: "In progress"
    },
    {
      id: 3,
      title: "Damaged study desk in Library",
      category: "Furniture",
      description: "Desk number 14 has a broken leg and wobbles severely, making it unsafe for student use.",
      status: "Pending"
    },
    {
      id: 4,
      title: "Air conditioner failure in Lab 3",
      category: "Electrical",
      description: "The main split-unit AC in Computer Lab 3 is blowing warm air and showing error code E4.",
      status: "In progress"
    },
    {
      id: 5,
      title: "Blocked drain outside Cafeteria",
      category: "Plumbing",
      description: "Rainwater drain next to the main cafeteria entrance is blocked by debris causing flooding.",
      status: "Completed"
    },
    {
      id: 6,
      title: "Broken whiteboard frame in Room B12",
      category: "Furniture",
      description: "The mounting bracket on the left side of the whiteboard has detached from the wall.",
      status: "Pending"
    },
    {
      id: 7,
      title: "Loose power socket at study pod",
      category: "Electrical",
      description: "The wall outlet near Pod 4 is loose and sparks intermittently when laptop chargers are plugged in.",
      status: "Completed"
    },
    {
      id: 8,
      title: "Damaged auditorium seat hinge",
      category: "Furniture",
      description: "Seat 45 in Row F cannot stay folded and the armrest has cracked off.",
      status: "Pending"
    }
  ];

  function readData() {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify(INITIAL_SEEDS, null, 2), "utf-8");
      return [...INITIAL_SEEDS];
    }
    try {
      const content = fs.readFileSync(dataFile, "utf-8");
      return JSON.parse(content || "[]");
    } catch {
      return [...INITIAL_SEEDS];
    }
  }

  function writeData(records) {
    fs.writeFileSync(dataFile, JSON.stringify(records, null, 2), "utf-8");
  }

  pool = {
    async query(sql, params = []) {
      const upper = sql.trim().toUpperCase();
      const records = readData();

      // 1. Health check: SELECT 1
      if (upper === "SELECT 1" || upper.startsWith("SELECT 1")) {
        return { rows: [{ "?column?": 1 }], rowCount: 1 };
      }

      // 2. SELECT all: SELECT id, title, category, description, status FROM records ORDER BY id
      if (upper.startsWith("SELECT") && !upper.includes("WHERE")) {
        const sorted = [...records].sort((a, b) => a.id - b.id);
        return { rows: sorted, rowCount: sorted.length };
      }

      // 3. SELECT one: SELECT id, title, category, description, status FROM records WHERE id = $1
      if (upper.startsWith("SELECT") && upper.includes("WHERE ID =")) {
        const id = Number(params[0]);
        const record = records.find(r => r.id === id);
        return { rows: record ? [record] : [], rowCount: record ? 1 : 0 };
      }

      // 4. INSERT: INSERT INTO records (title, category, description, status) VALUES ($1, $2, $3, $4) RETURNING *
      if (upper.startsWith("INSERT")) {
        const maxId = records.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
        const newRecord = {
          id: maxId + 1,
          title: params[0],
          category: params[1],
          description: params[2],
          status: params[3]
        };
        records.push(newRecord);
        writeData(records);
        return { rows: [newRecord], rowCount: 1 };
      }

      // 5. UPDATE: UPDATE records SET title = $1, category = $2, description = $3, status = $4 WHERE id = $5 RETURNING *
      if (upper.startsWith("UPDATE")) {
        const id = Number(params[4]);
        const index = records.findIndex(r => r.id === id);
        if (index === -1) {
          return { rows: [], rowCount: 0 };
        }
        const updatedRecord = {
          id,
          title: params[0],
          category: params[1],
          description: params[2],
          status: params[3]
        };
        records[index] = updatedRecord;
        writeData(records);
        return { rows: [updatedRecord], rowCount: 1 };
      }

      // 6. DELETE: DELETE FROM records WHERE id = $1 RETURNING id
      if (upper.startsWith("DELETE")) {
        const id = Number(params[0]);
        const index = records.findIndex(r => r.id === id);
        if (index === -1) {
          return { rows: [], rowCount: 0 };
        }
        records.splice(index, 1);
        writeData(records);
        return { rows: [{ id }], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    }
  };
}

module.exports = pool;

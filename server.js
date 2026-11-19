// server.js
// Express server entry point for Activity 7 Backend Development

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// Parse CORS allowed origins
const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

// Allow configured origins or allow all when testing locally
app.use(cors({
  origin: origins.length > 0 ? (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (origins.includes(origin) || origins.includes("*")) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive CORS for academic demonstration
  } : "*"
}));

app.use(express.json());

// Step 8: GET / - Documentation guide for the marker
app.get("/", (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}`;

  const guideHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Guide - Campus Maintenance Requests</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 2rem auto; padding: 0 1.25rem; color: #1e293b; background: #f8fafc; }
    header { background: #1456a0; color: #ffffff; padding: 1.75rem; border-radius: 8px; margin-bottom: 2rem; }
    h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
    .badge { background: rgba(255, 255, 255, 0.2); padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: bold; font-size: 0.85rem; }
    .info-card { background: #ffffff; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    code, pre { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
    pre { padding: 1rem; overflow-x: auto; }
    .method { font-weight: bold; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .get { background: #e0f2fe; color: #0369a1; }
    .post { background: #dcfce7; color: #15803d; }
    .put { background: #fef3c7; color: #b45309; }
    .delete { background: #fee2e2; color: #b91c1c; }
    .status-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 0.75rem 1rem; margin-top: 1.5rem; }
    a { color: #1456a0; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <span class="badge">ICT251 Activity 7</span>
    <h1>Campus Maintenance Requests API</h1>
    <p>Backend REST API Service for tracking and managing campus maintenance requests.</p>
  </header>

  <div class="info-card">
    <h2>Student & Project Details</h2>
    <p><strong>Project Name:</strong> Campus Maintenance Requests</p>
    <p><strong>Student Name:</strong> AZARIAH CHIPILI</p>
    <p><strong>Student Number:</strong> 202505021</p>
    <p><strong>Live API Base URL:</strong> <code>${baseUrl}</code></p>
    <p><strong>Quick Links:</strong> <a href="${baseUrl}/health">/health</a> | <a href="${baseUrl}/api/records">/api/records</a></p>
  </div>

  <div class="info-card">
    <h2>Required API Routes</h2>
    <table>
      <thead>
        <tr>
          <th>Method</th>
          <th>Route</th>
          <th>Description</th>
          <th>Success Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="method get">GET</span></td>
          <td><code>/</code></td>
          <td>API guide for the marker (this page)</td>
          <td><code>200 OK</code></td>
        </tr>
        <tr>
          <td><span class="method get">GET</span></td>
          <td><code>/health</code></td>
          <td>Server and database health check</td>
          <td><code>200 OK</code></td>
        </tr>
        <tr>
          <td><span class="method get">GET</span></td>
          <td><code>/api/records</code></td>
          <td>Read all maintenance records</td>
          <td><code>200 OK</code></td>
        </tr>
        <tr>
          <td><span class="method get">GET</span></td>
          <td><code>/api/records/:id</code></td>
          <td>Read a single record by ID</td>
          <td><code>200 OK</code> / <code>404 Not Found</code></td>
        </tr>
        <tr>
          <td><span class="method post">POST</span></td>
          <td><code>/api/records</code></td>
          <td>Create a new maintenance record</td>
          <td><code>201 Created</code></td>
        </tr>
        <tr>
          <td><span class="method put">PUT</span></td>
          <td><code>/api/records/:id</code></td>
          <td>Update an existing record</td>
          <td><code>200 OK</code> / <code>404 Not Found</code></td>
        </tr>
        <tr>
          <td><span class="method delete">DELETE</span></td>
          <td><code>/api/records/:id</code></td>
          <td>Delete a record by ID</td>
          <td><code>200 OK</code> / <code>404 Not Found</code></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="info-card">
    <h2>Record Schema & Validation Rules</h2>
    <ul>
      <li><code>id</code>: Positive whole number (generated by database, not editable).</li>
      <li><code>title</code>: String between 3 and 80 characters.</li>
      <li><code>category</code>: String between 2 and 40 characters (e.g. Electrical, Plumbing, Furniture).</li>
      <li><code>description</code>: String between 5 and 300 characters.</li>
      <li><code>status</code>: Exact value: <code>Pending</code>, <code>In progress</code>, or <code>Completed</code>.</li>
    </ul>

    <h3>Sample JSON Body for POST and PUT</h3>
    <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>
  </div>

  <div class="info-card">
    <h2>HTTP Status Codes</h2>
    <ul>
      <li><code>200 OK</code>: Successful GET, PUT, or DELETE request.</li>
      <li><code>201 Created</code>: Record successfully created via POST.</li>
      <li><code>400 Bad Request</code>: Missing fields, length violation, spaces only, invalid status, or malformed JSON.</li>
      <li><code>404 Not Found</code>: Record or route does not exist.</li>
      <li><code>500 Internal Server Error</code>: Unexpected server error.</li>
      <li><code>503 Service Unavailable</code>: Database connection failure on /health.</li>
    </ul>

    <div class="status-note">
      <strong>Note on Free Cloud Hosting (Render):</strong>
      <p>Render free instances automatically sleep after periods of inactivity. If the service is idle, the first request may take 30 to 60 seconds to spin up.</p>
    </div>
  </div>
</body>
</html>`;

  res.status(200).send(guideHtml);
});

// GET /health - Server and database health check
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      message: "Database connection failed.",
      error: err.message
    });
  }
});

// Mount records router
app.use("/api/records", require("./routes/records"));

// Final handler for unknown routes (404)
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Error handling middleware (4 parameters)
app.use((err, req, res, next) => {
  // Handle malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }

  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "An unexpected server error occurred."
  });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;

// routes/records.js
// Express Router handling CRUD operations for maintenance records

const express = require("express");
const router = express.Router();
const pool = require("../db");

const VALID_STATUSES = ["Pending", "In progress", "Completed"];

/**
 * Helper to validate positive integer IDs from route parameters
 */
function parseAndValidateId(idParam) {
  if (!idParam || !/^\d+$/.test(idParam.trim())) {
    return { valid: false, message: "ID must be a positive whole number." };
  }
  const id = parseInt(idParam.trim(), 10);
  if (id <= 0) {
    return { valid: false, message: "ID must be a positive whole number." };
  }
  return { valid: true, id };
}

/**
 * Helper to validate input body for POST and PUT requests
 */
function validateRecordBody(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Request body must be a valid JSON object." };
  }

  const { title, category, description, status } = body;

  // Check types before trimming
  if (typeof title !== "string" || title.trim().length === 0) {
    return { valid: false, message: "Title must have 3 to 80 characters." };
  }
  if (typeof category !== "string" || category.trim().length === 0) {
    return { valid: false, message: "Category must have 2 to 40 characters." };
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return { valid: false, message: "Description must have 5 to 300 characters." };
  }
  if (typeof status !== "string" || status.trim().length === 0) {
    return { valid: false, message: "Status must be one of: Pending, In progress, Completed." };
  }

  const trimmedTitle = title.trim();
  const trimmedCategory = category.trim();
  const trimmedDescription = description.trim();
  const trimmedStatus = status.trim();

  // Length and format rules
  if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
    return { valid: false, message: "Title must have 3 to 80 characters." };
  }
  if (trimmedCategory.length < 2 || trimmedCategory.length > 40) {
    return { valid: false, message: "Category must have 2 to 40 characters." };
  }
  if (trimmedDescription.length < 5 || trimmedDescription.length > 300) {
    return { valid: false, message: "Description must have 5 to 300 characters." };
  }
  if (!VALID_STATUSES.includes(trimmedStatus)) {
    return { valid: false, message: "Status must be one of: Pending, In progress, Completed." };
  }

  return {
    valid: true,
    data: {
      title: trimmedTitle,
      category: trimmedCategory,
      description: trimmedDescription,
      status: trimmedStatus
    }
  };
}

// 1. GET /api/records - Read all records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/records/:id - Read one record
router.get("/:id", async (req, res, next) => {
  const idCheck = parseAndValidateId(req.params.id);
  if (!idCheck.valid) {
    return res.status(400).json({ message: idCheck.message });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records WHERE id = $1",
      [idCheck.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Record with id ${idCheck.id} not found.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/records - Create a record
router.post("/", async (req, res, next) => {
  const validation = validateRecordBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const { title, category, description, status } = validation.data;

  try {
    const result = await pool.query(
      "INSERT INTO records (title, category, description, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, category, description, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// 4. PUT /api/records/:id - Update a record
router.put("/:id", async (req, res, next) => {
  const idCheck = parseAndValidateId(req.params.id);
  if (!idCheck.valid) {
    return res.status(400).json({ message: idCheck.message });
  }

  const validation = validateRecordBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const { title, category, description, status } = validation.data;

  try {
    const result = await pool.query(
      "UPDATE records SET title = $1, category = $2, description = $3, status = $4 WHERE id = $5 RETURNING *",
      [title, category, description, status, idCheck.id]
    );

    if (result.rowCount === 0 || result.rows.length === 0) {
      return res.status(404).json({ message: `Record with id ${idCheck.id} not found.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /api/records/:id - Delete a record
router.delete("/:id", async (req, res, next) => {
  const idCheck = parseAndValidateId(req.params.id);
  if (!idCheck.valid) {
    return res.status(400).json({ message: idCheck.message });
  }

  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [idCheck.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Record with id ${idCheck.id} not found.` });
    }

    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

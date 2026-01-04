// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

/**
 * Comma-separated list of allowed origins, e.g:
 * CORS_ORIGINS=https://vibe-selector.vercel.app,http://localhost:3000
 */
function parseAllowedOrigins() {
  const raw =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL || // backward compatible with your old env
    "";

  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return new Set(list);
}

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, cb) {
    // Allow server-to-server tools (no Origin header)
    if (!origin) return cb(null, true);

    // If nothing configured, allow all (handy for debugging; lock down in prod)
    if (allowedOrigins.size === 0) return cb(null, true);

    if (allowedOrigins.has(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

function driveStreamUrlFromRow(row) {
  const fileId =
    row.drive_file_id ||
    row.google_drive_id ||
    row.file_id ||
    row.song_id ||
    row.gdrive_id;

  if (!fileId || typeof fileId !== "string") return null;

  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
    fileId,
  )}`;
}

function withComputedFields(row) {
  const stream_url = driveStreamUrlFromRow(row);
  return stream_url ? { ...row, stream_url } : row;
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

// Optional helper endpoint (useful if your frontend has a random button)
app.get("/songs/random", async (_req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM songs ORDER BY RANDOM() LIMIT 1");
    if (!result.rows?.length) return res.status(404).json({ message: "No songs found" });

    res.json(withComputedFields(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

app.get("/songs/:persona", async (req, res, next) => {
  try {
    const persona = decodeURIComponent(req.params.persona || "").trim();
    if (!persona) return res.status(400).json({ message: "Missing persona" });

    const result = await db.query(
      "SELECT * FROM songs WHERE LOWER(persona) = LOWER($1) ORDER BY RANDOM() LIMIT 1",
      [persona],
    );

    if (!result.rows?.length) {
      return res.status(404).json({ message: "No songs found for this persona", persona });
    }

    res.json(withComputedFields(result.rows[0]));
  } catch (err) {
    next(err);
  }
});

// JSON 404 (still includes CORS because cors() runs before routes)
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler (also returns JSON; CORS headers still present)
app.use((err, _req, res, _next) => {
  const msg = err instanceof Error ? err.message : "Unknown error";
  console.error("API Error:", msg);
  res.status(500).json({ error: msg });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});

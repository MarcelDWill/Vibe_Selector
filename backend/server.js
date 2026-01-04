// ==============================
// backend/server.js
// ==============================
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Readable } = require("node:stream");
const db = require("./db");

const app = express();

function parseAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.size === 0) return cb(null, true);
    return allowedOrigins.has(origin)
      ? cb(null, true)
      : cb(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Express 5: do NOT use "*"
app.options(/.*/, cors(corsOptions));

app.use(express.json());

function googleDriveApiMediaUrl(driveId) {
  const key = process.env.GOOGLE_DRIVE_API_KEY;
  if (!key) return null;
  const id = encodeURIComponent(driveId);
  const k = encodeURIComponent(key);
  // acknowledgeAbuse helps for files that trigger Google's scan warning
  return `https://www.googleapis.com/drive/v3/files/${id}?alt=media&acknowledgeAbuse=true&key=${k}`;
}

function googleUcFallbackUrl(driveId) {
  // Less reliable for some files; kept as fallback if you don't want to set API key.
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
}

function serializeSong(row) {
  return {
    id: row.id,
    title: row.title,
    persona: row.persona,
    vibe_score: row.vibe_score,
    drive_id: row.drive_id,
    created_at: row.created_at,
  };
}

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/songs/random", async (_req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM songs ORDER BY RANDOM() LIMIT 1");
    if (!rows?.length) return res.status(404).json({ message: "No songs found" });
    res.json(serializeSong(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.get("/songs/:persona", async (req, res, next) => {
  try {
    const persona = decodeURIComponent(req.params.persona || "").trim();
    if (!persona) return res.status(400).json({ message: "Missing persona" });

    const { rows } = await db.query(
      "SELECT * FROM songs WHERE LOWER(persona) = LOWER($1) ORDER BY RANDOM() LIMIT 1",
      [persona],
    );

    if (!rows?.length) {
      return res.status(404).json({ message: "No songs found for persona", persona });
    }

    res.json(serializeSong(rows[0]));
  } catch (err) {
    next(err);
  }
});

/**
 * Audio proxy (more reliable than direct Google URLs, supports Range).
 * Frontend should use: <audio src={`${API_URL}/stream/${drive_id}`} />
 *
 * Env:
 *   GOOGLE_DRIVE_API_KEY=... (recommended)
 */
app.get("/stream/:driveId", async (req, res, next) => {
  const driveId = decodeURIComponent(req.params.driveId || "").trim();
  if (!driveId) return res.status(400).json({ message: "Missing driveId" });

  const range = req.headers.range;
  const url = googleDriveApiMediaUrl(driveId) || googleUcFallbackUrl(driveId);

  const controller = new AbortController();
  req.on("close", () => controller.abort());

  try {
    const upstream = await fetch(url, {
      method: "GET",
      headers: range ? { Range: range } : undefined,
      redirect: "follow",
      signal: controller.signal,
    });

    if (!upstream.ok && upstream.status !== 206) {
      const text = await upstream.text().catch(() => "");
      return res.status(502).json({
        message: "Upstream fetch failed",
        upstream_status: upstream.status,
        detail: text.slice(0, 500),
      });
    }

    res.status(upstream.status);

    const passHeaders = [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "cache-control",
      "etag",
      "last-modified",
    ];

    for (const h of passHeaders) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }

    if (!upstream.body) return res.end();

    // Node 18+/20: convert Web ReadableStream to Node stream
    const nodeStream =
      typeof Readable.fromWeb === "function"
        ? Readable.fromWeb(upstream.body)
        : upstream.body;

    nodeStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

// JSON 404
app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

// JSON error
app.use((err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("API Error:", message);
  res.status(500).json({ error: message });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on :${PORT}`);
});
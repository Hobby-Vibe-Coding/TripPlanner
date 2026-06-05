import { getDb } from "../_db.js";
import jwt from "jsonwebtoken";
import { put } from "@vercel/blob";
import Busboy from "busboy";

export const config = {
  api: { bodyParser: false },
};

const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
  "application/pdf",
]);
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Read the full request body into a Buffer, compatible with Vercel's dev runtime
// where req.pipe() may silently receive an already-consumed stream.
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    // If Vercel has already buffered the body (bodyParser:false still buffers in some
    // local-dev versions), it surfaces as req.body being a Buffer or string.
    if (Buffer.isBuffer(req.body)) return resolve(req.body);
    if (typeof req.body === "string") return resolve(Buffer.from(req.body));

    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(rawBody, headers) {
  return new Promise((resolve, reject) => {
    const result = { tripId: "", label: "", fileBuffer: null, fileName: "", mimeType: "", fileSize: 0 };

    const bb = Busboy({ headers, limits: { fileSize: MAX_BYTES } });

    bb.on("field", (name, val) => {
      if (name === "tripId") result.tripId = val;
      if (name === "label") result.label = val;
    });

    bb.on("file", (_fieldname, file, info) => {
      result.mimeType = info.mimeType;
      result.fileName = info.filename || "upload";
      const chunks = [];
      file.on("data", chunk => { chunks.push(chunk); result.fileSize += chunk.length; });
      file.on("limit", () => reject(new Error("FILE_TOO_LARGE")));
      file.on("end", () => { result.fileBuffer = Buffer.concat(chunks); });
    });

    bb.on("finish", () => resolve(result));
    bb.on("error", reject);

    // Write the already-buffered body into busboy rather than piping the stream,
    // which can silently produce "Unexpected end of form" in Vercel's local dev.
    bb.write(rawBody);
    bb.end();
  });
}

export default async function handler(req, res) {
  try {
    return await _handler(req, res);
  } catch (err) {
    console.error("[docs/upload] uncaught:", err);
    if (!res.writableEnded) res.status(500).json({ error: err.message || String(err) });
  }
}

async function _handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const rawBody = await readRawBody(req);

  let parsed;
  try {
    parsed = await parseMultipart(rawBody, req.headers);
  } catch (err) {
    if (err.message === "FILE_TOO_LARGE") return res.status(413).json({ error: "File too large (max 20 MB)" });
    throw err;
  }

  const { tripId, label, fileBuffer, fileName, mimeType, fileSize } = parsed;

  if (!fileBuffer) return res.status(400).json({ error: "No file provided" });
  if (!ALLOWED_MIME.has(mimeType)) return res.status(400).json({ error: "File type not allowed. Upload images or PDFs only." });
  if (!tripId) return res.status(400).json({ error: "tripId required" });

  const sql = getDb();

  // Verify the user owns the trip
  const [trip] = await sql`SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${user.id}`;
  if (!trip) return res.status(403).json({ error: "Forbidden" });

  // Upload to Vercel Blob (server-side only — blob URL never sent to client)
  const blobKey = `docs/${user.id}/${tripId}/${uid()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(blobKey, fileBuffer, { access: "private", contentType: mimeType });

  const docId = uid();
  await sql`
    INSERT INTO documents (id, trip_id, user_id, filename, label, mime_type, size_bytes, blob_url)
    VALUES (${docId}, ${tripId}, ${user.id}, ${fileName}, ${label || fileName}, ${mimeType}, ${fileSize}, ${blob.url})
  `;

  return res.status(200).json({
    id: docId,
    filename: fileName,
    label: label || fileName,
    mime_type: mimeType,
    size_bytes: fileSize,
    uploaded_at: new Date().toISOString(),
  });
}

import { getDb } from "../_db.js";
import jwt from "jsonwebtoken";
import Busboy from "busboy";
import { getServiceAccountAccessToken } from "../_google-drive-auth.js";

// Vercel's Hobby plan caps a deployment at 12 Serverless Functions, so the
// three Drive endpoints (folder listing, thumbnail proxy, upload) live in
// this single file instead of one file each — dispatched by method/action.
export const config = {
  api: { bodyParser: false },
};

const ALLOWED_UPLOAD_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"]);
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      const { action } = req.query;
      if (action === "thumb") return await handleThumb(req, res);
      return await handleFolder(req, res);
    }
    if (req.method === "POST") return await handleUpload(req, res);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[drive] uncaught:", err);
    if (!res.writableEnded) res.status(500).json({ error: err.message || String(err) });
  }
}

// ── GET ?action=folder — list images in a public Drive folder ────────────────
async function handleFolder(req, res) {
  const { folderId } = req.query;
  if (!folderId || !/^[a-zA-Z0-9_-]+$/.test(folderId))
    return res.status(400).json({ error: "Invalid folderId" });

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
  url.searchParams.set("fields", "files(id,name,createdTime,imageMediaMetadata,thumbnailLink,mimeType)");
  url.searchParams.set("orderBy", "createdTime");
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("key", apiKey);

  try {
    const driveRes = await fetch(url.toString());
    if (!driveRes.ok) {
      const err = await driveRes.json().catch(() => ({}));
      if (driveRes.status === 404) return res.status(404).json({ error: "Folder not found or not public" });
      return res.status(502).json({ error: err?.error?.message || "Drive API error" });
    }
    const data = await driveRes.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    return res.status(200).json({ files: data.files || [] });
  } catch {
    return res.status(502).json({ error: "Failed to reach Google Drive API" });
  }
}

// ── GET ?action=thumb — proxy a file's thumbnail image ────────────────────────
async function handleThumb(req, res) {
  const { fileId, sz } = req.query;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) return res.status(400).end();

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).end();

  const size = Math.min(2000, Math.max(100, parseInt(sz) || 400));

  try {
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=thumbnailLink&key=${encodeURIComponent(apiKey)}`
    );
    if (!metaRes.ok) return res.status(metaRes.status).end();

    const meta = await metaRes.json();
    if (!meta.thumbnailLink) return res.status(404).end();

    const thumbUrl = meta.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
    const imgRes = await fetch(thumbUrl);
    if (!imgRes.ok) return res.status(imgRes.status).end();

    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.setHeader("Content-Type", imgRes.headers.get("content-type") || "image/jpeg");
    res.send(Buffer.from(await imgRes.arrayBuffer()));
  } catch {
    res.status(502).end();
  }
}

// ── POST — upload a photo into a linked Drive folder via the service account ─
function readRawBody(req) {
  return new Promise((resolve, reject) => {
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
    const result = { folderId: "", shareToken: "", fileBuffer: null, fileName: "", mimeType: "", fileSize: 0 };

    const bb = Busboy({ headers, limits: { fileSize: MAX_UPLOAD_BYTES } });

    bb.on("field", (name, val) => {
      if (name === "folderId") result.folderId = val;
      if (name === "shareToken") result.shareToken = val;
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

    bb.write(rawBody);
    bb.end();
  });
}

function buildMultipartBody(boundary, metadata, mimeType, fileBuffer) {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
}

async function handleUpload(req, res) {
  const rawBody = await readRawBody(req);

  let parsed;
  try {
    parsed = await parseMultipart(rawBody, req.headers);
  } catch (err) {
    if (err.message === "FILE_TOO_LARGE") return res.status(413).json({ error: "File too large (max 20 MB)" });
    throw err;
  }

  const { folderId, shareToken, fileBuffer, fileName, mimeType, fileSize } = parsed;

  if (!folderId || !/^[a-zA-Z0-9_-]+$/.test(folderId)) return res.status(400).json({ error: "Invalid folderId" });
  if (!fileBuffer) return res.status(400).json({ error: "No file provided" });
  if (!ALLOWED_UPLOAD_MIME.has(mimeType)) return res.status(400).json({ error: "Only images can be uploaded here." });
  if (fileSize > MAX_UPLOAD_BYTES) return res.status(413).json({ error: "File too large (max 20 MB)" });

  const sql = getDb();

  // Resolve which trip this folder belongs to, then authorize either as the
  // trip owner (JWT) or as an edit-mode share-link collaborator (shareToken).
  const [tripRow] = await sql`SELECT id AS trip_id, user_id FROM trips WHERE drive_folder_id = ${folderId}`;
  if (!tripRow) return res.status(404).json({ error: "This folder isn't linked to a trip" });

  let authorized = false;
  const jwtUser = verifyToken(req);
  if (jwtUser && jwtUser.id === tripRow.user_id) authorized = true;
  if (!authorized && shareToken) {
    const [tok] = await sql`SELECT 1 FROM share_tokens WHERE token = ${shareToken} AND trip_id = ${tripRow.trip_id} AND mode = 'edit'`;
    if (tok) authorized = true;
  }
  if (!authorized) return res.status(403).json({ error: "Forbidden" });

  let accessToken;
  try {
    accessToken = await getServiceAccountAccessToken();
  } catch (err) {
    console.error("[drive upload] service account auth failed:", err.message);
    return res.status(500).json({ error: "Photo upload isn't configured yet" });
  }

  const boundary = `tp${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const body = buildMultipartBody(boundary, { name: fileName, parents: [folderId] }, mimeType, fileBuffer);

  const driveRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,thumbnailLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const driveData = await driveRes.json().catch(() => ({}));
  if (!driveRes.ok) {
    console.error("[drive upload] Drive API error:", driveRes.status, driveData);
    return res.status(driveRes.status === 403 ? 403 : 502).json({ error: driveData?.error?.message || "Drive upload failed" });
  }

  return res.status(200).json({ file: driveData });
}

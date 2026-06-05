import { getDb } from "../../_db.js";
import jwt from "jsonwebtoken";

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const sql = getDb();

  // Verify the requester owns this document
  const [doc] = await sql`
    SELECT blob_url, mime_type, filename FROM documents
    WHERE id = ${id} AND user_id = ${user.id}
  `;
  if (!doc) return res.status(403).json({ error: "Forbidden" });

  // Fetch from Vercel Blob server-side and stream to client
  const upstream = await fetch(doc.blob_url);
  if (!upstream.ok) return res.status(502).json({ error: "Could not retrieve file" });

  const buf = Buffer.from(await upstream.arrayBuffer());

  res.setHeader("Content-Type", doc.mime_type);
  res.setHeader("Content-Disposition", `inline; filename="${doc.filename.replace(/"/g, '_')}"`);
  res.setHeader("Cache-Control", "private, max-age=300");
  return res.send(buf);
}

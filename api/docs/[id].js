import { getDb } from "../_db.js";
import jwt from "jsonwebtoken";
import { del } from "@vercel/blob";

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;
  const sql = getDb();

  // Verify ownership and get blob URL for deletion
  const [doc] = await sql`SELECT blob_url FROM documents WHERE id = ${id} AND user_id = ${user.id}`;
  if (!doc) return res.status(403).json({ error: "Forbidden" });

  // Delete from Vercel Blob first, then remove DB row
  await del(doc.blob_url);
  await sql`DELETE FROM documents WHERE id = ${id} AND user_id = ${user.id}`;

  return res.status(200).json({ ok: true });
}

import { getDb } from "../_db.js";
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

  const tripId = req.query.tripId;
  if (!tripId) return res.status(400).json({ error: "tripId required" });

  const sql = getDb();

  // Verify ownership
  const [trip] = await sql`SELECT id FROM trips WHERE id = ${tripId} AND user_id = ${user.id}`;
  if (!trip) return res.status(403).json({ error: "Forbidden" });

  // Return metadata only — no blob_url
  const docs = await sql`
    SELECT id, filename, label, mime_type, size_bytes, uploaded_at
    FROM documents
    WHERE trip_id = ${tripId} AND user_id = ${user.id}
    ORDER BY uploaded_at DESC
  `;

  return res.status(200).json(docs);
}

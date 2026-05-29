import { getDb } from "../_db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

function randomToken() {
  return crypto.randomBytes(16).toString("hex"); // 32 hex chars, 128-bit entropy
}

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { tripId, mode = "read" } = req.body || {};
  if (!tripId) return res.status(400).json({ error: "tripId required" });
  if (mode !== "read" && mode !== "edit") return res.status(400).json({ error: "mode must be 'read' or 'edit'" });

  const sql = getDb();

  // Validate the trip belongs to this user
  const tripRow = await sql`SELECT 1 FROM trips WHERE id = ${tripId} AND user_id = ${user.id} LIMIT 1`;
  if (!tripRow.length) return res.status(404).json({ error: "Trip not found" });

  // Return existing token if one already exists for this user + trip + mode
  const existing = await sql`SELECT token FROM share_tokens WHERE user_id = ${user.id} AND trip_id = ${tripId} AND mode = ${mode}`;
  if (existing.length) return res.status(200).json({ token: existing[0].token, mode });

  const token = randomToken();
  await sql`INSERT INTO share_tokens (token, user_id, trip_id, mode) VALUES (${token}, ${user.id}, ${tripId}, ${mode})`;
  return res.status(201).json({ token, mode });
}

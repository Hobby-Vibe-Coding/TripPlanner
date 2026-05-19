import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

function randomToken(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    jwt.verify(auth.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { tripId, mode = "read" } = req.body || {};
  if (!tripId) return res.status(400).json({ error: "tripId required" });
  if (mode !== "read" && mode !== "edit") return res.status(400).json({ error: "mode must be 'read' or 'edit'" });

  const sql = neon(process.env.DATABASE_URL);

  // Each trip can have both a read and an edit token — look up by tripId AND mode.
  const existing = await sql`SELECT token FROM share_tokens WHERE trip_id = ${tripId} AND mode = ${mode}`;
  if (existing.length) return res.status(200).json({ token: existing[0].token, mode });

  const token = randomToken();
  await sql`INSERT INTO share_tokens (token, trip_id, mode) VALUES (${token}, ${tripId}, ${mode})`;
  return res.status(201).json({ token, mode });
}

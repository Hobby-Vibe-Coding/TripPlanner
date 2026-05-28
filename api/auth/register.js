import { getDb } from "../_db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const DEFAULT_DATA = '{"trips":[],"settings":{"theme":"beach","currency":"USD"}}';
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password } = req.body || {};

  if (!username || !USERNAME_RE.test(username.toLowerCase())) {
    return res.status(400).json({
      error: "Username must be 3–20 characters: letters, numbers, underscores only.",
    });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  const sql = getDb();
  const normalizedUsername = username.toLowerCase();

  const existing = await sql`SELECT id FROM users WHERE username = ${normalizedUsername}`;
  if (existing.length) return res.status(409).json({ error: "Username already taken." });

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${normalizedUsername}, ${passwordHash})
    RETURNING id, username
  `;

  await sql`
    INSERT INTO app_data (user_id, data) VALUES (${user.id}, ${DEFAULT_DATA})
    ON CONFLICT (user_id) DO NOTHING
  `;

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
  return res.status(201).json({ token });
}

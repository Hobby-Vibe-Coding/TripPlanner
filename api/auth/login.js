import { getDb } from "../_db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required." });
  }

  const sql = getDb();
  const rows = await sql`SELECT id, username, password_hash FROM users WHERE username = ${username.toLowerCase()}`;
  if (!rows.length) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid username or password." });

  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
  return res.status(200).json({ token });
}

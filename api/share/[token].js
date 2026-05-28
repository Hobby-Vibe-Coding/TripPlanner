import { getDb } from "../_db.js";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token required" });

  const sql = getDb();
  const tokenRow = await sql`SELECT user_id, trip_id, mode FROM share_tokens WHERE token = ${token}`;
  if (!tokenRow.length) return res.status(404).json({ error: "Share link not found or expired" });

  const { user_id: userId, trip_id: tripId, mode } = tokenRow[0];

  // ── GET: return the trip + its mode so the frontend knows which auth state to apply ──
  if (req.method === "GET") {
    const dataRow = await sql`SELECT data FROM app_data WHERE user_id = ${userId}`;
    if (!dataRow.length) return res.status(404).json({ error: "No data found" });

    let appState;
    try {
      appState = JSON.parse(dataRow[0].data);
    } catch {
      return res.status(500).json({ error: "Corrupted state data" });
    }

    const trip = (appState.trips || []).find((t) => t.id === tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });

    return res.status(200).json({ trip, settings: appState.settings, mode });
  }

  // ── PUT: update only the one shared trip (edit-mode tokens only) ──
  if (req.method === "PUT") {
    if (mode !== "edit") {
      return res.status(403).json({ error: "This share link is read-only" });
    }

    const { trip } = req.body || {};
    if (!trip || typeof trip !== "object") {
      return res.status(400).json({ error: "trip object required" });
    }
    if (trip.id !== tripId) {
      return res.status(403).json({ error: "Trip ID does not match this share token" });
    }

    const dataRow = await sql`SELECT data FROM app_data WHERE user_id = ${userId}`;
    if (!dataRow.length) return res.status(404).json({ error: "No data found" });

    let appState;
    try {
      appState = JSON.parse(dataRow[0].data);
    } catch {
      return res.status(500).json({ error: "Corrupted state data" });
    }

    const idx = (appState.trips || []).findIndex((t) => t.id === tripId);
    if (idx === -1) return res.status(404).json({ error: "Trip not found" });

    appState.trips[idx] = trip;
    const newData = JSON.stringify(appState);

    await sql`
      INSERT INTO app_data (user_id, data) VALUES (${userId}, ${newData})
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

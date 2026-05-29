import { getDb, withTransaction } from "../_db.js";
import { loadStateFromDB, insertTripRows } from "../data.js";

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

  // ── GET: return the single trip + settings ───────────────────────────────────
  if (req.method === "GET") {
    const state = await loadStateFromDB(sql, userId);
    const trip = state.trips.find(t => t.id === tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    return res.status(200).json({ trip, settings: state.settings, mode });
  }

  // ── PUT: update the single shared trip (edit-mode only) ──────────────────────
  if (req.method === "PUT") {
    if (mode !== "edit") return res.status(403).json({ error: "This share link is read-only" });

    const { trip } = req.body || {};
    if (!trip || typeof trip !== "object") return res.status(400).json({ error: "trip object required" });
    if (trip.id !== tripId) return res.status(403).json({ error: "Trip ID does not match this share token" });

    // Verify trip belongs to the token owner
    const ownerCheck = await sql`SELECT trip_order FROM trips WHERE id = ${tripId} AND user_id = ${userId}`;
    if (!ownerCheck.length) return res.status(404).json({ error: "Trip not found" });
    const currentOrder = ownerCheck[0].trip_order;

    // Delete the trip (CASCADE removes all children) and re-insert with updated data
    await withTransaction(async (txSql) => {
      await txSql`DELETE FROM trips WHERE id = ${tripId} AND user_id = ${userId}`;
      await insertTripRows(txSql, userId, trip, currentOrder);
    });

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

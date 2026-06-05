import { getDb, withTransaction } from "./_db.js";
import jwt from "jsonwebtoken";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" } },
};

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Build the full app state from relational tables ───────────────────────────
export async function loadStateFromDB(sql, userId) {
  const [
    settingsRows, tripRows, travRows, groupRows, gmRows,
    dayRows, slotRows, expRows, partRows,
    catRows, itemRows, resRows, noteRows,
    taskRows, annRows,
  ] = await Promise.all([
    sql`SELECT theme, currency FROM user_settings WHERE user_id = ${userId}`,
    sql`SELECT * FROM trips WHERE user_id = ${userId} ORDER BY trip_order, created_at`,
    sql`SELECT tt.trip_id, tt.name FROM trip_travelers tt JOIN trips t ON tt.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY tt.trip_id, tt.pos`,
    sql`SELECT g.id, g.trip_id, g.name FROM trip_groups g JOIN trips t ON g.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY g.pos`,
    sql`SELECT gm.group_id, gm.name FROM trip_group_members gm JOIN trip_groups g ON gm.group_id = g.id JOIN trips t ON g.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY gm.pos`,
    sql`SELECT d.id, d.trip_id, d.day_index, d.theme FROM itinerary_days d JOIN trips t ON d.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY d.trip_id, d.day_index`,
    sql`SELECT s.* FROM itinerary_slots s JOIN itinerary_days d ON s.day_id = d.id JOIN trips t ON d.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY s.day_id, s.slot_index`,
    sql`SELECT e.* FROM expenses e JOIN trips t ON e.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY e.trip_id, e.exp_order`,
    sql`SELECT ep.* FROM expense_participants ep JOIN expenses e ON ep.expense_id = e.id JOIN trips t ON e.trip_id = t.id WHERE t.user_id = ${userId}`,
    sql`SELECT pc.* FROM packing_categories pc JOIN trips t ON pc.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY pc.trip_id, pc.pos`,
    sql`SELECT pi.* FROM packing_items pi JOIN packing_categories pc ON pi.category_id = pc.id JOIN trips t ON pc.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY pi.category_id, pi.pos`,
    sql`SELECT r.* FROM reservations r JOIN trips t ON r.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY r.trip_id, r.res_order`,
    sql`SELECT n.* FROM notes n JOIN trips t ON n.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY n.trip_id, n.note_order`,
    sql`SELECT tk.* FROM trip_tasks tk JOIN trips t ON tk.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY tk.trip_id, tk.task_order`,
    sql`SELECT a.* FROM trip_announcements a JOIN trips t ON a.trip_id = t.id WHERE t.user_id = ${userId} ORDER BY a.trip_id, a.pinned DESC, a.ann_order`,
  ]);

  // Build lookup maps
  const byTrip = (rows, key = 'trip_id') => rows.reduce((m, r) => {
    (m[r[key]] = m[r[key]] || []).push(r); return m;
  }, {});

  const travMap  = byTrip(travRows);
  const groupMap = byTrip(groupRows);
  const gmMap    = gmRows.reduce((m, r) => { (m[r.group_id] = m[r.group_id] || []).push(r.name); return m; }, {});
  const dayMap   = byTrip(dayRows);
  const slotMap  = byTrip(slotRows, 'day_id');
  const expMap   = byTrip(expRows);
  const partMap  = byTrip(partRows, 'expense_id');
  const catMap   = byTrip(catRows);
  const itemMap  = byTrip(itemRows, 'category_id');
  const resMap   = byTrip(resRows);
  const noteMap  = byTrip(noteRows);
  const taskMap  = byTrip(taskRows);
  const annMap   = byTrip(annRows);

  const trips = tripRows.map(tr => {
    const groups = (groupMap[tr.id] || []).map(g => ({
      id: g.id, name: g.name, members: gmMap[g.id] || [],
    }));

    const itinerary = (dayMap[tr.id] || []).map(d => ({
      id: d.id, theme: d.theme,
      events: (slotMap[d.id] || [])
        .filter(s => s.activity?.trim())
        .map(s => ({
          id:            String(s.id),
          startSlot:     s.slot_index,
          span:          s.span || 1,
          activity:      s.activity,
          address:       s.address || '',
          reservationId: s.reservation_id || null,
          filled:        true,
        })),
    }));

    const expenses = (expMap[tr.id] || []).map(e => {
      const parts = partMap[e.id] || [];
      return {
        id: e.id, name: e.name, category: e.category,
        cost: parseFloat(e.cost), date: e.expense_date || '',
        note: e.note, splitMethod: e.split_method,
        splitDetails: e.split_details || {},
        paidBy:    parts.filter(p => p.is_payer).map(p => p.name),
        splitAmong: parts.filter(p => p.is_splitter).map(p => p.name),
        settledBy:  parts.filter(p => p.is_settled).map(p => p.name),
      };
    });

    const packing = (catMap[tr.id] || []).map(c => ({
      id: c.id, name: c.name,
      items: (itemMap[c.id] || []).map(i => ({ id: i.id, name: i.name, packed: i.packed })),
    }));

    const reservations = (resMap[tr.id] || []).map(r => ({
      id: r.id, name: r.name, status: r.status,
      dueDate: r.due_date || '', confNum: r.conf_num,
      link: r.link, note: r.note,
    }));

    const notes = (noteMap[tr.id] || []).map(n => ({ id: n.id, text: n.note_text }));

    return {
      id: tr.id, title: tr.title, destination: tr.destination,
      destinationCoords: tr.dest_lat != null ? { lat: tr.dest_lat, lng: tr.dest_lng } : null,
      emoji: tr.emoji, startDate: tr.start_date, endDate: tr.end_date,
      budget: tr.budget != null ? parseFloat(tr.budget) : null,
      timezone: tr.timezone, createdAt: tr.created_at, memoryLine: tr.memory_line,
      driveFolder: {
        folderId: tr.drive_folder_id || null,
        thumbnailId: tr.drive_thumbnail_id || null,
        thumbnailUrl: tr.drive_thumbnail_url || null,
      },
      myTraveler: tr.my_traveler || null,
      timeSlots: Array.isArray(tr.time_slots) ? tr.time_slots : [],
      travelerSchedule: tr.traveler_schedule || {},
      travelers: (travMap[tr.id] || []).map(r => r.name),
      groups, itinerary, expenses, packing, reservations, notes,
      tasks: (taskMap[tr.id] || []).map(tk => ({
        id: tk.id, title: tk.title, assignedTo: tk.assigned_to,
        status: tk.status, dueDate: tk.due_date || '',
      })),
      announcements: (annMap[tr.id] || []).map(a => ({
        id: a.id, text: a.ann_text, pinned: a.pinned,
      })),
    };
  });

  const s = settingsRows[0] || {};
  return { trips, settings: { theme: s.theme || 'beach', currency: s.currency || 'USD' } };
}

// ── Persist a single trip and all its children (inside an open tx) ────────────
export async function insertTripRows(sql, userId, trip, order) {
  await sql`
    INSERT INTO trips
      (id, user_id, title, destination, dest_lat, dest_lng, emoji,
       start_date, end_date, budget, timezone, created_at, memory_line,
       drive_folder_id, drive_thumbnail_id, drive_thumbnail_url,
       my_traveler, time_slots, traveler_schedule, trip_order)
    VALUES (
      ${trip.id}, ${userId},
      ${trip.title || ''}, ${trip.destination || ''},
      ${trip.destinationCoords?.lat ?? null}, ${trip.destinationCoords?.lng ?? null},
      ${trip.emoji || '✈️'},
      ${trip.startDate || ''}, ${trip.endDate || ''},
      ${trip.budget ?? null}, ${trip.timezone || ''},
      ${trip.createdAt || new Date().toISOString()},
      ${trip.memoryLine || ''},
      ${trip.driveFolder?.folderId ?? null},
      ${trip.driveFolder?.thumbnailId ?? null},
      ${trip.driveFolder?.thumbnailUrl ?? null},
      ${trip.myTraveler ?? null},
      ${JSON.stringify(trip.timeSlots || [])},
      ${JSON.stringify(trip.travelerSchedule || {})},
      ${order}
    )`;

  for (let i = 0; i < (trip.travelers || []).length; i++) {
    await sql`INSERT INTO trip_travelers (trip_id, name, pos) VALUES (${trip.id}, ${trip.travelers[i]}, ${i})`;
  }

  for (let gi = 0; gi < (trip.groups || []).length; gi++) {
    const g = trip.groups[gi];
    if (!g.id) continue;
    await sql`INSERT INTO trip_groups (id, trip_id, name, pos) VALUES (${g.id}, ${trip.id}, ${g.name || ''}, ${gi})`;
    for (let mi = 0; mi < (g.members || []).length; mi++) {
      await sql`INSERT INTO trip_group_members (group_id, name, pos) VALUES (${g.id}, ${g.members[mi]}, ${mi}) ON CONFLICT DO NOTHING`;
    }
  }

  for (let di = 0; di < (trip.itinerary || []).length; di++) {
    const day = trip.itinerary[di];
    if (!day.id) continue;
    await sql`INSERT INTO itinerary_days (id, trip_id, day_index, theme) VALUES (${day.id}, ${trip.id}, ${di}, ${day.theme || ''})`;
    const eventsToInsert = day.events
      ? day.events.filter(ev => ev.activity?.trim())
      : (day.slots || []).map((s, si) => s?.activity?.trim() ? { startSlot: si, ...s } : null).filter(Boolean);
    for (const ev of eventsToInsert) {
      const slotIndex = ev.startSlot ?? ev.slot_index ?? 0;
      await sql`INSERT INTO itinerary_slots (day_id, slot_index, time_label, activity, address, span, reservation_id)
        VALUES (${day.id}, ${slotIndex}, ${ev.time || ev.time_label || ''}, ${ev.activity || ''}, ${ev.address || ''}, ${ev.span ?? 1}, ${ev.reservationId ?? ev.reservation_id ?? null})`;
    }
  }

  for (let ei = 0; ei < (trip.expenses || []).length; ei++) {
    const e = trip.expenses[ei];
    if (!e.id) continue;
    await sql`INSERT INTO expenses (id, trip_id, name, category, cost, expense_date, note, split_method, split_details, exp_order)
      VALUES (${e.id}, ${trip.id}, ${e.name || ''}, ${e.category || ''}, ${e.cost ?? 0}, ${e.date || ''}, ${e.note || ''}, ${e.splitMethod || 'equal'}, ${JSON.stringify(e.splitDetails || {})}, ${ei})`;

    const parts = new Map();
    const setFlag = (name, flag) => {
      if (!parts.has(name)) parts.set(name, { p: false, s: false, d: false });
      parts.get(name)[flag] = true;
    };
    (e.paidBy    || []).forEach(n => setFlag(n, 'p'));
    (e.splitAmong || []).forEach(n => setFlag(n, 's'));
    (e.settledBy  || []).forEach(n => setFlag(n, 'd'));
    for (const [name, f] of parts) {
      await sql`INSERT INTO expense_participants (expense_id, name, is_payer, is_splitter, is_settled)
        VALUES (${e.id}, ${name}, ${f.p}, ${f.s}, ${f.d}) ON CONFLICT DO NOTHING`;
    }
  }

  for (let ci = 0; ci < (trip.packing || []).length; ci++) {
    const cat = trip.packing[ci];
    if (!cat.id) continue;
    await sql`INSERT INTO packing_categories (id, trip_id, name, pos) VALUES (${cat.id}, ${trip.id}, ${cat.name || ''}, ${ci})`;
    for (let ii = 0; ii < (cat.items || []).length; ii++) {
      const item = cat.items[ii];
      if (!item.id) continue;
      await sql`INSERT INTO packing_items (id, category_id, name, packed, pos) VALUES (${item.id}, ${cat.id}, ${item.name || ''}, ${item.packed || false}, ${ii})`;
    }
  }

  for (let ri = 0; ri < (trip.reservations || []).length; ri++) {
    const r = trip.reservations[ri];
    if (!r.id) continue;
    await sql`INSERT INTO reservations (id, trip_id, name, status, due_date, conf_num, link, note, res_order)
      VALUES (${r.id}, ${trip.id}, ${r.name || ''}, ${r.status || 'pending'}, ${r.dueDate ?? r.due_date ?? ''}, ${r.confNum ?? r.conf_num ?? ''}, ${r.link || ''}, ${r.note || ''}, ${ri})`;
  }

  for (let ni = 0; ni < (trip.notes || []).length; ni++) {
    const n = trip.notes[ni];
    if (!n.id) continue;
    await sql`INSERT INTO notes (id, trip_id, note_text, note_order) VALUES (${n.id}, ${trip.id}, ${n.text || ''}, ${ni})`;
  }

  for (let ti = 0; ti < (trip.tasks || []).length; ti++) {
    const tk = trip.tasks[ti];
    if (!tk.id) continue;
    await sql`INSERT INTO trip_tasks (id, trip_id, title, assigned_to, status, due_date, task_order)
      VALUES (${tk.id}, ${trip.id}, ${tk.title || ''}, ${tk.assignedTo || ''}, ${tk.status || 'pending'}, ${tk.dueDate || ''}, ${ti})`;
  }

  for (let ai = 0; ai < (trip.announcements || []).length; ai++) {
    const a = trip.announcements[ai];
    if (!a.id) continue;
    await sql`INSERT INTO trip_announcements (id, trip_id, ann_text, pinned, ann_order)
      VALUES (${a.id}, ${trip.id}, ${a.text || ''}, ${a.pinned || false}, ${ai})`;
  }
}

// ── API Handler ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const sql = getDb();
    // If user has no relational data yet, return default state
    const tripCheck = await sql`SELECT 1 FROM trips WHERE user_id = ${user.id} LIMIT 1`;
    const settingsCheck = await sql`SELECT 1 FROM user_settings WHERE user_id = ${user.id} LIMIT 1`;
    if (!tripCheck.length && !settingsCheck.length) {
      // New user or pre-migration: fall back to app_data if it exists
      const blob = await sql`SELECT data FROM app_data WHERE user_id = ${user.id}`;
      if (blob.length) {
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(blob[0].data);
      }
      return res.status(200).json({ trips: [], settings: { theme: "beach", currency: "USD" } });
    }
    const state = await loadStateFromDB(sql, user.id);
    return res.status(200).json(state);
  }

  if (req.method === "PUT") {
    const state = req.body;
    if (!state || typeof state !== "object") return res.status(400).json({ error: "Invalid body" });

    try { await withTransaction(async (sql) => {
      // Upsert settings
      const settings = state.settings || {};
      await sql`INSERT INTO user_settings (user_id, theme, currency) VALUES (${user.id}, ${settings.theme || 'beach'}, ${settings.currency || 'USD'})
        ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme, currency = EXCLUDED.currency`;

      // Full state save (used by importJson and resetAll only)
      await sql`DELETE FROM trips WHERE user_id = ${user.id}`;
      for (let i = 0; i < (state.trips || []).length; i++) {
        await insertTripRows(sql, user.id, state.trips[i], i);
      }
    }); } catch (err) {
      // FK violation on user_id means the JWT references a user that doesn't
      // exist in this database — likely a stale token from another environment.
      if (err.code === '23503' && err.detail?.includes('users')) {
        return res.status(401).json({
          error: "Session invalid for this database. Please sign out and register/login again.",
          hint: "Run: localStorage.removeItem('tp_token') in the browser console, then reload."
        });
      }
      console.error('Save error:', err.message, err.code, err.detail);
      return res.status(500).json({ error: 'Save failed', detail: err.message });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

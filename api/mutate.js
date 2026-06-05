import { getDb } from "./_db.js";
import { insertTripRows } from "./data.js";
import jwt from "jsonwebtoken";

export const config = {
  api: { bodyParser: { sizeLimit: "1mb" } },
};

function verifyToken(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET); }
  catch { return null; }
}

async function ownsTrip(sql, tripId, userId) {
  const rows = await sql`SELECT 1 FROM trips WHERE id = ${tripId} AND user_id = ${userId} LIMIT 1`;
  return rows.length > 0;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { type, ...p } = req.body || {};
  if (!type) return res.status(400).json({ error: "Missing mutation type" });

  const sql = getDb();

  try {
    switch (type) {

      // ── Settings ──────────────────────────────────────────────────────────────
      case "updateSettings": {
        await sql`INSERT INTO user_settings (user_id, theme, currency)
          VALUES (${user.id}, ${p.theme || 'beach'}, ${p.currency || 'USD'})
          ON CONFLICT (user_id) DO UPDATE SET
            theme    = CASE WHEN ${p.theme    !== undefined} THEN ${p.theme    || 'beach'} ELSE user_settings.theme    END,
            currency = CASE WHEN ${p.currency !== undefined} THEN ${p.currency || 'USD'}   ELSE user_settings.currency END`;
        break;
      }

      // ── Trip CRUD ─────────────────────────────────────────────────────────────
      case "createTrip": {
        const { trip } = p;
        if (!trip?.id) return res.status(400).json({ error: "trip.id required" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM trips WHERE user_id = ${user.id}`;
        await insertTripRows(sql, user.id, trip, c);
        break;
      }

      case "deleteTrip": {
        await sql`DELETE FROM trips WHERE id = ${p.tripId} AND user_id = ${user.id}`;
        break;
      }

      case "updateTripOrder": {
        if (!Array.isArray(p.tripIds)) return res.status(400).json({ error: "tripIds required" });
        for (let i = 0; i < p.tripIds.length; i++) {
          await sql`UPDATE trips SET trip_order = ${i} WHERE id = ${p.tripIds[i]} AND user_id = ${user.id}`;
        }
        break;
      }

      // ── Trip fields ───────────────────────────────────────────────────────────
      case "updateTripFields": {
        const { tripId, fields } = p;
        if (!tripId || !fields) return res.status(400).json({ error: "tripId and fields required" });
        // Each entry maps a client key to an UPDATE statement — column names are static strings, never interpolated
        const handlers = {
          title:            (v) => sql`UPDATE trips SET title               = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          destination:      (v) => sql`UPDATE trips SET destination         = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          emoji:            (v) => sql`UPDATE trips SET emoji               = ${v ?? '✈️'}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          budget:           (v) => sql`UPDATE trips SET budget              = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          timezone:         (v) => sql`UPDATE trips SET timezone            = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          memoryLine:       (v) => sql`UPDATE trips SET memory_line         = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          startDate:        (v) => sql`UPDATE trips SET start_date          = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          endDate:          (v) => sql`UPDATE trips SET end_date            = ${v ?? ''}    WHERE id = ${tripId} AND user_id = ${user.id}`,
          myTraveler:       (v) => sql`UPDATE trips SET my_traveler         = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          timeSlots:        (v) => sql`UPDATE trips SET time_slots          = ${JSON.stringify(v ?? [])} WHERE id = ${tripId} AND user_id = ${user.id}`,
          destLat:          (v) => sql`UPDATE trips SET dest_lat            = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          destLng:          (v) => sql`UPDATE trips SET dest_lng            = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          driveFolderId:    (v) => sql`UPDATE trips SET drive_folder_id     = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          driveThumbnailId: (v) => sql`UPDATE trips SET drive_thumbnail_id  = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
          driveThumbnailUrl:(v) => sql`UPDATE trips SET drive_thumbnail_url = ${v ?? null}  WHERE id = ${tripId} AND user_id = ${user.id}`,
        };
        for (const [key, val] of Object.entries(fields)) {
          if (handlers[key]) await handlers[key](val);
        }
        break;
      }

      // ── Travelers ─────────────────────────────────────────────────────────────
      case "addTraveler": {
        const { tripId, name } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM trip_travelers WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO trip_travelers (trip_id, name, pos) VALUES (${tripId}, ${name}, ${c}) ON CONFLICT DO NOTHING`;
        break;
      }

      case "removeTraveler": {
        const { tripId, name } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        await sql`DELETE FROM trip_travelers WHERE trip_id = ${tripId} AND name = ${name}`;
        // Compact positions
        const rows = await sql`SELECT id FROM trip_travelers WHERE trip_id = ${tripId} ORDER BY pos`;
        for (let i = 0; i < rows.length; i++) {
          await sql`UPDATE trip_travelers SET pos = ${i} WHERE id = ${rows[i].id}`;
        }
        break;
      }

      // ── Groups ────────────────────────────────────────────────────────────────
      case "addGroup": {
        const { tripId, group } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM trip_groups WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO trip_groups (id, trip_id, name, pos) VALUES (${group.id}, ${tripId}, ${group.name || ''}, ${c}) ON CONFLICT DO NOTHING`;
        for (let mi = 0; mi < (group.members || []).length; mi++) {
          await sql`INSERT INTO trip_group_members (group_id, name, pos) VALUES (${group.id}, ${group.members[mi]}, ${mi}) ON CONFLICT DO NOTHING`;
        }
        break;
      }

      case "updateGroup": {
        const { tripId, groupId, name, members } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        if (name !== undefined) {
          await sql`UPDATE trip_groups SET name = ${name} WHERE id = ${groupId}`;
        }
        if (members !== undefined) {
          for (let mi = 0; mi < members.length; mi++) {
            await sql`INSERT INTO trip_group_members (group_id, name, pos) VALUES (${groupId}, ${members[mi]}, ${mi})
              ON CONFLICT (group_id, name) DO UPDATE SET pos = EXCLUDED.pos`;
          }
          if (members.length > 0) {
            await sql`DELETE FROM trip_group_members WHERE group_id = ${groupId} AND name != ALL(${members}::text[])`;
          } else {
            await sql`DELETE FROM trip_group_members WHERE group_id = ${groupId}`;
          }
        }
        break;
      }

      case "deleteGroup": {
        await sql`DELETE FROM trip_groups WHERE id = ${p.groupId}`;
        break;
      }

      // ── Itinerary ─────────────────────────────────────────────────────────────
      case "updateDayTheme": {
        await sql`UPDATE itinerary_days SET theme = ${p.theme || ''} WHERE id = ${p.dayId}`;
        break;
      }

      case "updateDaySlots": {
        const { tripId, dayId, events, slots } = p;
        const data = events || slots || [];
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        await sql`DELETE FROM itinerary_slots WHERE day_id = ${dayId}`;
        for (let i = 0; i < data.length; i++) {
          const ev = data[i];
          if (!ev.activity?.trim()) continue;
          const slotIndex = ev.startSlot ?? ev.slot_index ?? i;
          await sql`INSERT INTO itinerary_slots (day_id, slot_index, time_label, activity, address, span, reservation_id)
            VALUES (${dayId}, ${slotIndex}, ${ev.time || ''}, ${ev.activity || ''}, ${ev.address || ''}, ${ev.span ?? 1}, ${ev.reservationId ?? null})`;
        }
        break;
      }

      case "syncTimeSlots": {
        const { tripId, timeSlots, days } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        await sql`UPDATE trips SET time_slots = ${JSON.stringify(timeSlots || [])} WHERE id = ${tripId}`;
        for (const day of (days || [])) {
          await sql`UPDATE itinerary_days SET theme = ${day.theme || ''} WHERE id = ${day.id}`;
          await sql`DELETE FROM itinerary_slots WHERE day_id = ${day.id}`;
          const evts = day.events || day.slots || [];
          for (let i = 0; i < evts.length; i++) {
            const ev = evts[i];
            if (!ev.activity?.trim()) continue;
            const slotIndex = ev.startSlot ?? ev.slot_index ?? i;
            await sql`INSERT INTO itinerary_slots (day_id, slot_index, time_label, activity, address, span, reservation_id)
              VALUES (${day.id}, ${slotIndex}, ${ev.time || ''}, ${ev.activity || ''}, ${ev.address || ''}, ${ev.span ?? 1}, ${ev.reservationId ?? null})`;
          }
        }
        break;
      }

      // ── Expenses ──────────────────────────────────────────────────────────────
      case "addExpense": {
        const { tripId, expense } = p;
        if (!expense?.id) return res.status(400).json({ error: "expense.id required" });
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM expenses WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO expenses (id, trip_id, name, category, cost, expense_date, note, split_method, split_details, exp_order)
          VALUES (${expense.id}, ${tripId}, ${expense.name || ''}, ${expense.category || 'Misc'},
                  ${expense.cost ?? 0}, ${expense.date || ''}, ${expense.note || ''},
                  ${expense.splitMethod || 'equal'}, ${JSON.stringify(expense.splitDetails || {})}, ${c})`;
        const parts0 = buildPartsMap(expense.paidBy, expense.splitAmong, expense.settledBy);
        for (const [name, f] of parts0) {
          await sql`INSERT INTO expense_participants (expense_id, name, is_payer, is_splitter, is_settled)
            VALUES (${expense.id}, ${name}, ${f.p}, ${f.s}, ${f.d}) ON CONFLICT DO NOTHING`;
        }
        break;
      }

      case "updateExpense": {
        const { expenseId, fields } = p;
        const handlers = {
          name:     (v) => sql`UPDATE expenses SET name         = ${v ?? ''}   WHERE id = ${expenseId}`,
          category: (v) => sql`UPDATE expenses SET category     = ${v ?? ''}   WHERE id = ${expenseId}`,
          cost:     (v) => sql`UPDATE expenses SET cost         = ${v ?? 0}    WHERE id = ${expenseId}`,
          date:     (v) => sql`UPDATE expenses SET expense_date = ${v ?? ''}   WHERE id = ${expenseId}`,
          note:     (v) => sql`UPDATE expenses SET note         = ${v ?? ''}   WHERE id = ${expenseId}`,
        };
        for (const [key, val] of Object.entries(fields)) {
          if (handlers[key]) await handlers[key](val);
        }
        break;
      }

      case "deleteExpense": {
        await sql`DELETE FROM expenses WHERE id = ${p.expenseId}`;
        break;
      }

      case "syncExpenseParticipants": {
        const { expenseId, paidBy, splitAmong, settledBy, splitMethod, splitDetails } = p;
        if (splitMethod !== undefined || splitDetails !== undefined) {
          await sql`UPDATE expenses SET split_method = ${splitMethod || 'equal'}, split_details = ${JSON.stringify(splitDetails || {})} WHERE id = ${expenseId}`;
        }
        const parts = buildPartsMap(paidBy, splitAmong, settledBy);
        for (const [name, f] of parts) {
          await sql`INSERT INTO expense_participants (expense_id, name, is_payer, is_splitter, is_settled)
            VALUES (${expenseId}, ${name}, ${f.p}, ${f.s}, ${f.d})
            ON CONFLICT (expense_id, name) DO UPDATE SET
              is_payer    = EXCLUDED.is_payer,
              is_splitter = EXCLUDED.is_splitter,
              is_settled  = EXCLUDED.is_settled`;
        }
        const names = [...parts.keys()];
        if (names.length > 0) {
          await sql`DELETE FROM expense_participants WHERE expense_id = ${expenseId} AND name != ALL(${names}::text[])`;
        } else {
          await sql`DELETE FROM expense_participants WHERE expense_id = ${expenseId}`;
        }
        break;
      }

      // ── Packing ───────────────────────────────────────────────────────────────
      case "addPackCategory": {
        const { tripId, category } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM packing_categories WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO packing_categories (id, trip_id, name, pos) VALUES (${category.id}, ${tripId}, ${category.name || ''}, ${c})`;
        for (let ii = 0; ii < (category.items || []).length; ii++) {
          const item = category.items[ii];
          await sql`INSERT INTO packing_items (id, category_id, name, packed, pos) VALUES (${item.id}, ${category.id}, ${item.name || ''}, ${item.packed || false}, ${ii})`;
        }
        break;
      }

      case "updatePackCategory": {
        await sql`UPDATE packing_categories SET name = ${p.name || ''} WHERE id = ${p.categoryId}`;
        break;
      }

      case "deletePackCategory": {
        await sql`DELETE FROM packing_categories WHERE id = ${p.categoryId}`;
        break;
      }

      case "syncPackCategories": {
        const { tripId, categories } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        await sql`DELETE FROM packing_categories WHERE trip_id = ${tripId}`;
        for (let ci = 0; ci < (categories || []).length; ci++) {
          const cat = categories[ci];
          if (!cat.id) continue;
          await sql`INSERT INTO packing_categories (id, trip_id, name, pos) VALUES (${cat.id}, ${tripId}, ${cat.name || ''}, ${ci})`;
          for (let ii = 0; ii < (cat.items || []).length; ii++) {
            const item = cat.items[ii];
            if (!item.id) continue;
            await sql`INSERT INTO packing_items (id, category_id, name, packed, pos) VALUES (${item.id}, ${cat.id}, ${item.name || ''}, ${item.packed || false}, ${ii})`;
          }
        }
        break;
      }

      case "addPackItem": {
        const { categoryId, item } = p;
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM packing_items WHERE category_id = ${categoryId}`;
        await sql`INSERT INTO packing_items (id, category_id, name, packed, pos) VALUES (${item.id}, ${categoryId}, ${item.name || ''}, ${item.packed || false}, ${c})`;
        break;
      }

      case "updatePackItem": {
        const { itemId } = p;
        if (p.name !== undefined)   await sql`UPDATE packing_items SET name   = ${p.name}   WHERE id = ${itemId}`;
        if (p.packed !== undefined) await sql`UPDATE packing_items SET packed = ${p.packed} WHERE id = ${itemId}`;
        break;
      }

      case "deletePackItem": {
        await sql`DELETE FROM packing_items WHERE id = ${p.itemId}`;
        break;
      }

      // ── Reservations ──────────────────────────────────────────────────────────
      case "addReservation": {
        const { tripId, reservation: r } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM reservations WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO reservations (id, trip_id, name, status, due_date, conf_num, link, note, res_order)
          VALUES (${r.id}, ${tripId}, ${r.name || ''}, ${r.status || 'pending'}, ${r.dueDate || ''},
                  ${r.confNum || ''}, ${r.link || ''}, ${r.note || ''}, ${c})`;
        break;
      }

      case "updateReservation": {
        const { resId, fields } = p;
        const handlers = {
          name:    (v) => sql`UPDATE reservations SET name     = ${v ?? ''} WHERE id = ${resId}`,
          status:  (v) => sql`UPDATE reservations SET status   = ${v ?? ''} WHERE id = ${resId}`,
          dueDate: (v) => sql`UPDATE reservations SET due_date = ${v ?? ''} WHERE id = ${resId}`,
          confNum: (v) => sql`UPDATE reservations SET conf_num = ${v ?? ''} WHERE id = ${resId}`,
          link:    (v) => sql`UPDATE reservations SET link     = ${v ?? ''} WHERE id = ${resId}`,
          note:    (v) => sql`UPDATE reservations SET note     = ${v ?? ''} WHERE id = ${resId}`,
        };
        for (const [key, val] of Object.entries(fields)) {
          if (handlers[key]) await handlers[key](val);
        }
        break;
      }

      case "deleteReservation": {
        await sql`DELETE FROM reservations WHERE id = ${p.resId}`;
        break;
      }

      // ── Notes ─────────────────────────────────────────────────────────────────
      case "addNote": {
        const { tripId, note } = p;
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM notes WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO notes (id, trip_id, note_text, note_order) VALUES (${note.id}, ${tripId}, ${note.text || ''}, ${c})`;
        break;
      }

      case "updateNote": {
        await sql`UPDATE notes SET note_text = ${p.text || ''} WHERE id = ${p.noteId}`;
        break;
      }

      case "deleteNote": {
        await sql`DELETE FROM notes WHERE id = ${p.noteId}`;
        break;
      }

      // ── Traveler schedule ─────────────────────────────────────────────────────
      case "setTravelerSchedule": {
        const { tripId, travelerName, joinDay, leaveDay } = p;
        if (!tripId || !travelerName) return res.status(400).json({ error: "tripId and travelerName required" });
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [row] = await sql`SELECT traveler_schedule FROM trips WHERE id = ${tripId}`;
        const schedule = row?.traveler_schedule || {};
        if (joinDay == null && leaveDay == null) {
          delete schedule[travelerName];
        } else {
          schedule[travelerName] = { joinDay: joinDay ?? 1, leaveDay: leaveDay ?? null };
        }
        await sql`UPDATE trips SET traveler_schedule = ${JSON.stringify(schedule)} WHERE id = ${tripId}`;
        break;
      }

      // ── Tasks ─────────────────────────────────────────────────────────────────
      case "addTask": {
        const { tripId, task } = p;
        if (!task?.id) return res.status(400).json({ error: "task.id required" });
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM trip_tasks WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO trip_tasks (id, trip_id, title, assigned_to, status, due_date, task_order)
          VALUES (${task.id}, ${tripId}, ${task.title || ''}, ${task.assignedTo || ''}, 'pending', ${task.dueDate || ''}, ${c})`;
        break;
      }

      case "updateTask": {
        const { taskId, fields } = p;
        const handlers = {
          title:      (v) => sql`UPDATE trip_tasks SET title       = ${v ?? ''}      WHERE id = ${taskId}`,
          assignedTo: (v) => sql`UPDATE trip_tasks SET assigned_to = ${v ?? ''}      WHERE id = ${taskId}`,
          status:     (v) => sql`UPDATE trip_tasks SET status      = ${v ?? 'pending'} WHERE id = ${taskId}`,
          dueDate:    (v) => sql`UPDATE trip_tasks SET due_date    = ${v ?? ''}      WHERE id = ${taskId}`,
        };
        for (const [key, val] of Object.entries(fields || {})) {
          if (handlers[key]) await handlers[key](val);
        }
        break;
      }

      case "toggleTask": {
        await sql`UPDATE trip_tasks SET status = CASE WHEN status = 'done' THEN 'pending' ELSE 'done' END WHERE id = ${p.taskId}`;
        break;
      }

      case "deleteTask": {
        await sql`DELETE FROM trip_tasks WHERE id = ${p.taskId}`;
        break;
      }

      // ── Announcements ─────────────────────────────────────────────────────────
      case "addAnnouncement": {
        const { tripId, announcement: a } = p;
        if (!a?.id) return res.status(400).json({ error: "announcement.id required" });
        if (!await ownsTrip(sql, tripId, user.id)) return res.status(403).json({ error: "Forbidden" });
        const [{ c }] = await sql`SELECT COUNT(*)::int AS c FROM trip_announcements WHERE trip_id = ${tripId}`;
        await sql`INSERT INTO trip_announcements (id, trip_id, ann_text, pinned, ann_order)
          VALUES (${a.id}, ${tripId}, ${a.text || ''}, ${a.pinned || false}, ${c})`;
        break;
      }

      case "updateAnnouncement": {
        await sql`UPDATE trip_announcements SET ann_text = ${p.text || ''} WHERE id = ${p.announcementId}`;
        break;
      }

      case "toggleAnnouncementPin": {
        await sql`UPDATE trip_announcements SET pinned = NOT pinned WHERE id = ${p.announcementId}`;
        break;
      }

      case "deleteAnnouncement": {
        await sql`DELETE FROM trip_announcements WHERE id = ${p.announcementId}`;
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown mutation type: ${type}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(`[mutate:${type}]`, err.message, err.code);
    return res.status(500).json({ error: 'Mutation failed', detail: err.message });
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────
function buildPartsMap(paidBy, splitAmong, settledBy) {
  const parts = new Map();
  const flag = (name, f) => {
    if (!parts.has(name)) parts.set(name, { p: false, s: false, d: false });
    parts.get(name)[f] = true;
  };
  (paidBy    || []).forEach(n => flag(n, 'p'));
  (splitAmong || []).forEach(n => flag(n, 's'));
  (settledBy  || []).forEach(n => flag(n, 'd'));
  return parts;
}

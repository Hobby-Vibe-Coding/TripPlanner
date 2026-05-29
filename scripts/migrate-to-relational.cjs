/**
 * Phase E migration: app_data JSON blob → relational tables.
 *
 * Usage:
 *   node scripts/migrate-to-relational.cjs
 *
 * Reads DATABASE_URL from process.env (or .env.local via dotenv).
 * Runs inside a single transaction — fully rolls back on any error.
 * Safe to re-run: clears new tables for affected users before re-inserting.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Manual .env.local loader — no dotenv dependency needed.
// Reads KEY=VALUE lines, skips comments and blanks, does not override existing env vars.
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
}

// Load .env.local first (higher priority), then .env as fallback
loadEnvFile(path.join(__dirname, '../.env.local'));
loadEnvFile(path.join(__dirname, '../.env'));

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('✓ Transaction started\n');

    // ── 1. Load all users + their app_data blobs ──────────────────────────────
    const { rows: dataRows } = await client.query(
      'SELECT u.id AS user_id, u.username, ad.data FROM users u JOIN app_data ad ON ad.user_id = u.id'
    );
    console.log(`Found ${dataRows.length} user(s) to migrate.\n`);

    for (const row of dataRows) {
      const userId = row.user_id;
      let state;
      try {
        state = JSON.parse(row.data);
      } catch {
        throw new Error(`Failed to parse JSON for user ${row.username} (id ${userId})`);
      }

      console.log(`─── Migrating user: ${row.username} (id ${userId})`);
      console.log(`    Trips in blob: ${(state.trips || []).length}`);

      // Clear any previous partial migration for this user
      await client.query('DELETE FROM trips WHERE user_id = $1', [userId]);
      await client.query(
        'INSERT INTO user_settings (user_id, theme, currency) VALUES ($1, $2, $3) ' +
        'ON CONFLICT (user_id) DO UPDATE SET theme = EXCLUDED.theme, currency = EXCLUDED.currency',
        [userId, state.settings?.theme || 'beach', state.settings?.currency || 'USD']
      );

      const trips = state.trips || [];
      let travCount = 0, groupCount = 0, dayCount = 0, slotCount = 0;
      let expCount = 0, partCount = 0, packCatCount = 0, packItemCount = 0;
      let resCount = 0, noteCount = 0;

      for (let ti = 0; ti < trips.length; ti++) {
        const t = trips[ti];
        if (!t.id) { console.warn(`    ⚠ Trip at index ${ti} has no id — skipped`); continue; }

        // ── Trip row ──────────────────────────────────────────────────────────
        await client.query(
          `INSERT INTO trips
            (id, user_id, title, destination, dest_lat, dest_lng, emoji,
             start_date, end_date, budget, timezone, created_at, memory_line,
             drive_folder_id, drive_thumbnail_id, drive_thumbnail_url,
             my_traveler, time_slots, trip_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
          [
            t.id, userId,
            t.title || '',
            t.destination || '',
            t.destinationCoords?.lat ?? null,
            t.destinationCoords?.lng ?? null,
            t.emoji || '✈️',
            t.startDate || '',
            t.endDate || '',
            t.budget ?? null,
            t.timezone || '',
            t.createdAt || new Date().toISOString(),
            t.memoryLine || '',
            t.driveFolder?.folderId ?? null,
            t.driveFolder?.thumbnailId ?? null,
            t.driveFolder?.thumbnailUrl ?? null,
            t.myTraveler ?? null,
            JSON.stringify(t.timeSlots || []),
            ti,
          ]
        );

        // ── Travelers ─────────────────────────────────────────────────────────
        for (let i = 0; i < (t.travelers || []).length; i++) {
          await client.query(
            'INSERT INTO trip_travelers (trip_id, name, pos) VALUES ($1, $2, $3)',
            [t.id, t.travelers[i], i]
          );
          travCount++;
        }

        // ── Groups + members ──────────────────────────────────────────────────
        for (let gi = 0; gi < (t.groups || []).length; gi++) {
          const g = t.groups[gi];
          if (!g.id) continue;
          await client.query(
            'INSERT INTO trip_groups (id, trip_id, name, pos) VALUES ($1, $2, $3, $4)',
            [g.id, t.id, g.name || '', gi]
          );
          groupCount++;
          for (let mi = 0; mi < (g.members || []).length; mi++) {
            await client.query(
              'INSERT INTO trip_group_members (group_id, name, pos) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
              [g.id, g.members[mi], mi]
            );
          }
        }

        // ── Itinerary days + slots ────────────────────────────────────────────
        for (let di = 0; di < (t.itinerary || []).length; di++) {
          const day = t.itinerary[di];
          if (!day.id) continue;
          await client.query(
            'INSERT INTO itinerary_days (id, trip_id, day_index, theme) VALUES ($1, $2, $3, $4)',
            [day.id, t.id, di, day.theme || '']
          );
          dayCount++;
          for (let si = 0; si < (day.slots || []).length; si++) {
            const s = day.slots[si];
            await client.query(
              `INSERT INTO itinerary_slots
                (day_id, slot_index, time_label, activity, address, span, reservation_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                day.id, si,
                s.time || '',
                s.activity || '',
                s.address || '',
                s.span ?? 1,
                s.reservationId ?? s.reservation_id ?? null,
              ]
            );
            slotCount++;
          }
        }

        // ── Expenses + participants ────────────────────────────────────────────
        for (let ei = 0; ei < (t.expenses || []).length; ei++) {
          const e = t.expenses[ei];
          if (!e.id) continue;
          await client.query(
            `INSERT INTO expenses
              (id, trip_id, name, category, cost, expense_date, note,
               split_method, split_details, exp_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              e.id, t.id,
              e.name || '',
              e.category || '',
              e.cost ?? 0,
              e.date || '',
              e.note || '',
              e.splitMethod || e.split_method || 'equal',
              JSON.stringify(e.splitDetails ?? e.split_details ?? {}),
              ei,
            ]
          );
          expCount++;

          // Merge paidBy / splitAmong / settledBy into participant rows
          const parts = new Map();
          const set = (name, flag) => {
            if (!parts.has(name)) parts.set(name, { isPayer: false, isSplitter: false, isSettled: false });
            parts.get(name)[flag] = true;
          };
          (e.paidBy || []).forEach(n => set(n, 'isPayer'));
          (e.splitAmong || []).forEach(n => set(n, 'isSplitter'));
          (e.settledBy || []).forEach(n => set(n, 'isSettled'));

          for (const [name, flags] of parts) {
            await client.query(
              `INSERT INTO expense_participants
                (expense_id, name, is_payer, is_splitter, is_settled)
               VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
              [e.id, name, flags.isPayer, flags.isSplitter, flags.isSettled]
            );
            partCount++;
          }
        }

        // ── Packing categories + items ─────────────────────────────────────────
        for (let ci = 0; ci < (t.packing || []).length; ci++) {
          const cat = t.packing[ci];
          if (!cat.id) continue;
          await client.query(
            'INSERT INTO packing_categories (id, trip_id, name, pos) VALUES ($1, $2, $3, $4)',
            [cat.id, t.id, cat.name || '', ci]
          );
          packCatCount++;
          for (let ii = 0; ii < (cat.items || []).length; ii++) {
            const item = cat.items[ii];
            if (!item.id) continue;
            await client.query(
              'INSERT INTO packing_items (id, category_id, name, packed, pos) VALUES ($1,$2,$3,$4,$5)',
              [item.id, cat.id, item.name || '', item.packed || false, ii]
            );
            packItemCount++;
          }
        }

        // ── Reservations ───────────────────────────────────────────────────────
        for (let ri = 0; ri < (t.reservations || []).length; ri++) {
          const r = t.reservations[ri];
          if (!r.id) continue;
          await client.query(
            `INSERT INTO reservations
              (id, trip_id, name, status, due_date, conf_num, link, note, res_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              r.id, t.id,
              r.name || '',
              r.status || 'pending',
              r.dueDate ?? r.due_date ?? '',
              r.confNum ?? r.conf_num ?? '',
              r.link || '',
              r.note || '',
              ri,
            ]
          );
          resCount++;
        }

        // ── Notes ──────────────────────────────────────────────────────────────
        for (let ni = 0; ni < (t.notes || []).length; ni++) {
          const n = t.notes[ni];
          if (!n.id) continue;
          await client.query(
            'INSERT INTO notes (id, trip_id, note_text, note_order) VALUES ($1,$2,$3,$4)',
            [n.id, t.id, n.text || '', ni]
          );
          noteCount++;
        }
      }

      console.log(`    ✓ trips: ${trips.length}, travelers: ${travCount}, groups: ${groupCount}`);
      console.log(`    ✓ days: ${dayCount}, slots: ${slotCount}`);
      console.log(`    ✓ expenses: ${expCount}, participants: ${partCount}`);
      console.log(`    ✓ pack categories: ${packCatCount}, items: ${packItemCount}`);
      console.log(`    ✓ reservations: ${resCount}, notes: ${noteCount}`);
    }

    // ── 2. Verify row counts ──────────────────────────────────────────────────
    console.log('\n── Verification ──────────────────────────────────────────────');
    for (const tbl of [
      'user_settings','trips','trip_travelers','trip_groups','trip_group_members',
      'itinerary_days','itinerary_slots','expenses','expense_participants',
      'packing_categories','packing_items','reservations','notes',
    ]) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM ${tbl}`);
      console.log(`  ${tbl.padEnd(26)} ${rows[0].count} rows`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Migration committed successfully.');
    console.log('   app_data table is untouched — verify the app works before running DROP TABLE app_data;');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration ROLLED BACK due to error:', e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

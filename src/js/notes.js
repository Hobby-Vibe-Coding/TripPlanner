import { state, route, currentUser, pastYearFilter, simplifyDebts, travEditMode,
         setTravEditMode, setCurrentUser, setState } from './state.js';
// Bridges – resolved at call-time via window (no circular imports needed)
const render        = ()    => window.render();
const mutate        = p     => window.mutate(p);
const showModal     = o     => window.showModal(o);
const closeModal    = ()    => window.closeModal();
const guardEdit     = ()    => window.guardEdit();
const currentTrip   = ()    => window.currentTrip();
const escapeHtml    = s     => window.escapeHtml(s);
const uid           = ()    => window.uid();


// -------- NOTES TAB --------
const NOTE_COLORS = ["#fef9c3","#dcfce7","#dbeafe","#fce7f3","#ffe4e6"];

function getNotes(t) {
  if (Array.isArray(t.notes)) return t.notes;
  // migrate legacy string
  if (t.notes) return [{ id: uid(), text: t.notes }];
  return [];
}

function renderNotes(t) {
  const notes = getNotes(t);
  const cards = notes.map((n, i) => `
    <div class="sticky-note" style="background:${NOTE_COLORS[i % NOTE_COLORS.length]}">
      <button class="note-remove" onclick="removeNote('${n.id}')" title="Remove note">×</button>
      <textarea placeholder="Write something..." oninput="updateNote('${n.id}', this.value)">${escapeHtml(n.text)}</textarea>
    </div>`).join("");
  return `
    <div class="panel">
      <div class="panel-head"><h3>Notes & ideas</h3></div>
      <div class="panel-sub" style="margin-bottom:20px;">Jot down anything — links, restaurant ideas, packing reminders, contact numbers...</div>
      <div class="sticky-board">
        ${cards}
        <button class="sticky-add" onclick="addNote()">
          <span style="font-size:24px;line-height:1">+</span>
          <span>Add Note</span>
        </button>
      </div>
    </div>
  `;
}

function addNote() {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (!Array.isArray(t.notes)) t.notes = getNotes(t);
  const note = { id: uid(), text: "" };
  t.notes.push(note);
  mutate({ type: 'addNote', tripId: t.id, note });
  render();
}

function removeNote(id) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (!Array.isArray(t.notes)) t.notes = getNotes(t);
  t.notes = t.notes.filter(n => n.id !== id);
  mutate({ type: 'deleteNote', noteId: id });
  render();
}

const _noteTimers = {};
function updateNote(id, text) {
  if (!guardEdit()) return;
  const t = currentTrip(); if (!t) return;
  if (!Array.isArray(t.notes)) t.notes = getNotes(t);
  const n = t.notes.find(n => n.id === id);
  if (!n) return;
  n.text = text; // update local state immediately
  clearTimeout(_noteTimers[id]);
  _noteTimers[id] = setTimeout(() => mutate({ type: 'updateNote', noteId: id, text }), 400);
}

Object.assign(window, { getNotes, renderNotes, addNote, removeNote, updateNote });

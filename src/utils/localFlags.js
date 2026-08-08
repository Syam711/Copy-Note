// Everything in this file is small, string-sized, and fine for
// localStorage. If you're ever tempted to store a whole note or note
// list here — don't; that's what db/localDb.js (IndexedDB) is for.

const KEYS = {
  lastSyncedAt: 'notesApp:lastSyncedAt',
  guestId: 'notesApp:guestId',
};

export function getLastSyncedAt() {
  return localStorage.getItem(KEYS.lastSyncedAt);
}

export function setLastSyncedAt(isoString) {
  localStorage.setItem(KEYS.lastSyncedAt, isoString);
}

// A guest (no account) still needs a stable identity so their local
// notes are consistently "theirs" across page reloads. This is never
// sent to the server — it's purely a local grouping key.
export function getOrCreateGuestId() {
  let id = localStorage.getItem(KEYS.guestId);
  if (!id) {
    id = `guest_${crypto.randomUUID()}`;
    localStorage.setItem(KEYS.guestId, id);
  }
  return id;
}

export function clearGuestId() {
  localStorage.removeItem(KEYS.guestId);
}

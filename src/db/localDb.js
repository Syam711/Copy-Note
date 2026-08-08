import Dexie from 'dexie';

// One IndexedDB database for the whole app. Dexie gives us indexes,
// async reads/writes, and a much bigger storage ceiling than
// localStorage — which is why note CONTENT lives here. localStorage
// is still used, but only for tiny flags (see utils/localFlags.js),
// never for the notes themselves.
export const db = new Dexie('notesApp');

db.version(1).stores({
  // '&id' = primary key, must be unique. The other fields listed are
  // indexed so we can query by them directly instead of scanning
  // every row — e.g. notes.where('is_archived').equals(1).
  notes: '&id, user_id, is_pinned, is_archived, deleted_at, updated_at',

  // Local-only bookkeeping: writes made while offline (or just
  // optimistically, before the server confirms) that still need to
  // reach Supabase. The sync engine drains this queue in the
  // background — see hooks/useLocalSync.js.
  pendingWrites: '&id, noteId, createdAt',
});

export default db;

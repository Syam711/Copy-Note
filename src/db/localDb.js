import Dexie from 'dexie';

// One IndexedDB database for the whole app. Dexie gives us indexes,
// async reads/writes, and a much bigger storage ceiling than
// localStorage — which is why note CONTENT lives here. localStorage
// is still used, but only for tiny flags (see utils/localFlags.js),
// never for the notes themselves.
export const db = new Dexie('notesApp');

db.version(1).stores({
  notes: '&id, user_id, is_pinned, is_archived, deleted_at, updated_at',
  pendingWrites: '&id, noteId, createdAt',
});

// v2: groups. Dexie migrates existing local databases to this
// automatically on next load — no data loss, it just adds the new
// index and table.
db.version(2).stores({
  notes: '&id, user_id, is_pinned, is_archived, deleted_at, updated_at, group_id',
  groups: '&id, user_id, is_archived, updated_at',
  pendingWrites: '&id, noteId, createdAt',
});

export default db;

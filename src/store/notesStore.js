import { create } from 'zustand';
import { db } from '../db/localDb';
import * as notesApi from '../api/notes.api';
import { isEmptyNote } from '../utils/noteHelpers';

export const useNotesStore = create((set, get) => ({
  ownerId: null,
  isGuest: true,
  notes: [], // flat, unfiltered — pages apply filterActive/filterArchived/filterTrashed
  loading: true,

  // Called once per owner change (app boot, sign in, sign out) —
  // see the useEffect in App.jsx that watches the auth store.
  init: async (ownerId, isGuest) => {
    set({ ownerId, isGuest, loading: true });
    await get().refreshFromLocal();
    set({ loading: false });

    if (!isGuest) {
      // Local cache renders instantly above; this reconciles it with
      // the server in the background so there's never a loading
      // spinner just to open the app.
      try {
        const remote = await notesApi.fetchAllNotes(ownerId);
        await db.notes.bulkPut(remote);
        await get().refreshFromLocal();
      } catch (err) {
        console.error('Background sync failed, showing local cache only:', err);
      }
    }
  },

  refreshFromLocal: async () => {
    const { ownerId } = get();
    if (!ownerId) return;
    const all = await db.notes.where('user_id').equals(ownerId).toArray();
    set({ notes: all });
  },

  createNote: async (draft) => {
    const { ownerId, isGuest } = get();
    if (isEmptyNote(draft)) return null; // never persist an empty note
    const note = {
      id: crypto.randomUUID(),
      user_id: ownerId,
      title: draft.title || '',
      description: draft.description || '',
      is_pinned: false,
      is_archived: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.notes.put(note);
    await get().refreshFromLocal();
    if (!isGuest) {
      notesApi.insertNote(note).catch((err) => console.error('Sync failed, will retry next load:', err));
    }
    return note;
  },

  // Handles edits, pin/archive toggles, and trash/restore — all of
  // them are just "change some fields and bump updated_at."
  updateNote: async (id, changes) => {
    const { isGuest } = get();
    await db.notes.update(id, { ...changes, updated_at: new Date().toISOString() });
    const updated = await db.notes.get(id);

    if (isEmptyNote(updated)) {
      // Edited down to nothing — remove entirely, don't send to trash.
      await db.notes.delete(id);
      if (!isGuest) notesApi.hardDeleteNote(id).catch(() => {});
    } else if (!isGuest) {
      notesApi.updateNote(id, changes).catch((err) => console.error('Sync failed, will retry next load:', err));
    }
    await get().refreshFromLocal();
  },

  trashNote: (id) => get().updateNote(id, { deleted_at: new Date().toISOString() }),
  restoreNote: (id) => get().updateNote(id, { deleted_at: null }),
  togglePin: (id, next) => get().updateNote(id, { is_pinned: next }),
  toggleArchive: (id, next) => get().updateNote(id, { is_archived: next }),
  toggleHidden: (id, next) => get().updateNote(id, { is_hidden: next }),

  // Manual "delete forever" from the Trash page — the 30-day version
  // of this happens automatically server-side via pg_cron instead.
  permanentlyDelete: async (id) => {
    const { isGuest } = get();
    await db.notes.delete(id);
    if (!isGuest) notesApi.hardDeleteNote(id).catch((err) => console.error('Sync failed, will retry next load:', err));
    await get().refreshFromLocal();
  },

  // Called from the Login page right after a guest signs up, if they
  // opt in to bringing their local notes with them.
  importGuestNotes: async (guestId, userId) => {
    const guestNotes = await db.notes.where('user_id').equals(guestId).toArray();
    if (guestNotes.length === 0) return;
    const migrated = guestNotes.map((n) => ({
      ...n,
      user_id: userId,
      updated_at: new Date().toISOString(),
    }));
    await db.notes.bulkPut(migrated); // same ids => updates in place, re-owns them
    await Promise.allSettled(migrated.map((n) => notesApi.insertNote(n)));
    await get().refreshFromLocal();
  },
}));

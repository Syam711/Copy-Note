import { create } from 'zustand';
import { db } from '../db/localDb';
import * as groupsApi from '../api/groups.api';
import { useNotesStore } from './notesStore';

// Smallest unused N among the user's own "Group N" titles — not a
// running counter, so deleting groups frees their numbers back up
// instead of the naming climbing forever.
function nextGroupName(existingGroups) {
  const used = new Set(
    existingGroups
      .map((g) => /^Group (\d+)$/.exec(g.title || '')?.[1])
      .filter(Boolean)
      .map(Number)
  );
  let n = 1;
  while (used.has(n)) n++;
  return `Group ${n}`;
}

export const useGroupsStore = create((set, get) => ({
  ownerId: null,
  isGuest: true,
  groups: [],
  loading: true,

  init: async (ownerId, isGuest) => {
    set({ ownerId, isGuest, loading: true });
    await get().refreshFromLocal();
    set({ loading: false });
    if (!isGuest) {
      try {
        const remote = await groupsApi.fetchAllGroups(ownerId);
        await db.groups.bulkPut(remote);
        await get().refreshFromLocal();
      } catch (err) {
        console.error('Group sync failed, showing local cache only:', err);
      }
    }
  },

  refreshFromLocal: async () => {
    const { ownerId } = get();
    if (!ownerId) return;
    const all = await db.groups.where('user_id').equals(ownerId).toArray();
    set({ groups: all });
  },

  // Every note reassignment funnels through notesStore's own
  // updateNote — that's the one place that already knows how to write
  // Dexie, sync Supabase, and refresh subscribers for a note. No
  // separate group_id-writing path to keep in sync with it.
  _assignNotesToGroup: async (noteIds, groupId) => {
    await Promise.all(noteIds.map((id) => useNotesStore.getState().updateNote(id, { group_id: groupId })));
  },

  _createGroupWithNotes: async (noteIds) => {
    if (noteIds.length === 0) return null;
    const { ownerId, isGuest, groups } = get();
    const group = {
      id: crypto.randomUUID(),
      user_id: ownerId,
      title: nextGroupName(groups),
      is_pinned: false,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await db.groups.put(group);
    await get().refreshFromLocal();
    if (!isGuest) {
      groupsApi.insertGroup(group).catch((err) => console.error('Sync failed, will retry next load:', err));
    }
    await get()._assignNotesToGroup(noteIds, group.id);
    return group;
  },

  // Deleting a group IS ungrouping — see api/groups.api.js. Dexie has
  // no foreign keys, so the "clear group_id on every note that
  // referenced it" step Postgres does automatically server-side has
  // to happen explicitly here for the local cache.
  _deleteGroupRow: async (id) => {
    const { isGuest } = get();
    const orphaned = await db.notes.where('group_id').equals(id).toArray();
    await Promise.all(orphaned.map((n) => db.notes.update(n.id, { group_id: null })));
    await db.groups.delete(id);
    if (!isGuest) {
      groupsApi.deleteGroup(id).catch((err) => console.error('Sync failed, will retry next load:', err));
    }
    await get().refreshFromLocal();
    await useNotesStore.getState().refreshFromLocal();
  },

  _updateGroup: async (id, changes) => {
    const { isGuest } = get();
    await db.groups.update(id, { ...changes, updated_at: new Date().toISOString() });
    await get().refreshFromLocal();
    if (!isGuest) {
      groupsApi.updateGroup(id, changes).catch((err) => console.error('Sync failed, will retry next load:', err));
    }
  },

  // The one entry point the bulk action bar calls for "Group" — which
  // of the three behaviors applies depends on how many EXISTING
  // groups are part of the current selection:
  //   0 groups  -> create a new group from the selected notes
  //   1 group   -> merge the selected notes into that group
  //   2+ groups -> dissolve all of them, fold everything into one new group
  formGroupFromSelection: async (noteIds, groupIds) => {
    if (groupIds.length === 1) {
      await get()._assignNotesToGroup(noteIds, groupIds[0]);
      return;
    }
    if (groupIds.length >= 2) {
      const formerMemberIds = useNotesStore
        .getState()
        .notes.filter((n) => groupIds.includes(n.group_id))
        .map((n) => n.id);
      // eslint-disable-next-line no-restricted-syntax
      for (const id of groupIds) {
        // eslint-disable-next-line no-await-in-loop
        await get()._deleteGroupRow(id);
      }
      const combined = [...new Set([...formerMemberIds, ...noteIds])];
      await get()._createGroupWithNotes(combined);
      return;
    }
    await get()._createGroupWithNotes(noteIds);
  },

  ungroup: (id) => get()._deleteGroupRow(id),
  renameGroup: (id, title) => get()._updateGroup(id, { title }),
  togglePin: (id, next) => get()._updateGroup(id, { is_pinned: next }),
  toggleArchive: (id, next) => get()._updateGroup(id, { is_archived: next }),

  // Used inside GroupOpenView's "Remove" action — takes selected
  // member notes back to standalone. If that empties the group of
  // every note (active or trashed), the group is cleaned up the same
  // way the purge cron does it server-side for the trash-expiry case.
  removeNotesFromGroup: async (noteIds) => {
    if (noteIds.length === 0) return;
    const groupId = useNotesStore.getState().notes.find((n) => noteIds.includes(n.id))?.group_id;
    await Promise.all(noteIds.map((id) => useNotesStore.getState().updateNote(id, { group_id: null })));
    if (!groupId) return;
    const stillReferencing = await db.notes.where('group_id').equals(groupId).count();
    if (stillReferencing === 0) await get()._deleteGroupRow(groupId);
  },

  // Mirrors notesStore.importGuestNotes — called from
  // ImportGuestNotesPrompt right after a guest signs up.
  importGuestGroups: async (guestId, userId) => {
    const guestGroups = await db.groups.where('user_id').equals(guestId).toArray();
    if (guestGroups.length === 0) return;
    const migrated = guestGroups.map((g) => ({ ...g, user_id: userId, updated_at: new Date().toISOString() }));
    await db.groups.bulkPut(migrated);
    await Promise.allSettled(migrated.map((g) => groupsApi.insertGroup(g)));
    await get().refreshFromLocal();
  },
}));

const PREVIEW_LENGTH = 80;

// Card display rule: show the title if there is one, otherwise the
// first lines of the description stand in as the title.
export function displayTitle(note) {
  if (note.title?.trim()) return note.title.trim();
  const flat = (note.description || '').replace(/\s+/g, ' ').trim();
  if (!flat) return 'Untitled note';
  return flat.length > PREVIEW_LENGTH
    ? `${flat.slice(0, PREVIEW_LENGTH)}…`
    : flat;
}

// A note with nothing in either field should never be persisted.
export function isEmptyNote(note) {
  return !note.title?.trim() && !note.description?.trim();
}

// What gets copied to the clipboard for the 1-click copy action.
export function copyableText(note) {
  return note.description?.trim() || '';
}

// --- Shared view selectors ---------------------------------------
// The notes store holds one flat, unfiltered array; every page derives
// its own view from it with these, so there's a single definition of
// "what counts as active/archived/trashed" instead of one per page.

function byPinnedThenRecency(a, b) {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  return new Date(b.updated_at) - new Date(a.updated_at);
}

// Notes with a group_id don't get their own card on the main grid —
// their group represents them there instead. Trash is the one view
// that's an exception: a trashed note still shows individually there
// regardless of group_id, since that's what makes restore-to-group
// possible to see happening.
export function filterActive(notes) {
  return notes
    .filter((n) => !n.deleted_at && !n.is_archived && !n.group_id)
    .sort(byPinnedThenRecency);
}

export function filterArchived(notes) {
  return notes
    .filter((n) => !n.deleted_at && n.is_archived && !n.group_id)
    .sort(byPinnedThenRecency);
}

export function filterTrashed(notes) {
  return notes
    .filter((n) => !!n.deleted_at)
    .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

export function filterActiveGroups(groups) {
  return groups.filter((g) => !g.is_archived).sort(byPinnedThenRecency);
}

export function filterArchivedGroups(groups) {
  return groups.filter((g) => g.is_archived).sort(byPinnedThenRecency);
}

// A group's own member list, sorted the same way a note grid is.
export function notesInGroup(notes, groupId) {
  return notes
    .filter((n) => n.group_id === groupId && !n.deleted_at)
    .sort(byPinnedThenRecency);
}

// Combines already-filtered notes and groups into one pinned-then-
// recency-sorted list of display items, tagging each with its type so
// NoteGrid knows whether to render a NoteCard or a GroupCard.
export function mergeNotesAndGroups(notes, groups, allNotes) {
  const items = [
    ...notes.map((note) => ({ type: 'note', note })),
    ...groups.map((group) => ({ type: 'group', group, members: notesInGroup(allNotes, group.id) })),
  ];
  return items.sort((a, b) => {
    const aPinned = a.type === 'note' ? a.note.is_pinned : a.group.is_pinned;
    const bPinned = b.type === 'note' ? b.note.is_pinned : b.group.is_pinned;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aTime = a.type === 'note' ? a.note.updated_at : a.group.updated_at;
    const bTime = b.type === 'note' ? b.note.updated_at : b.group.updated_at;
    return new Date(bTime) - new Date(aTime);
  });
}

import { stripLineMarker } from './richText';

const PREVIEW_LENGTH = 80;

// Card display rule: show the title if there is one, otherwise the
// first line of the description stands in as the title — stripped of
// any "- " / "- [ ] " marker, so an untitled checklist note doesn't
// show raw syntax where a title would go.
export function displayTitle(note) {
  if (note.title?.trim()) return note.title.trim();
  const firstLine = (note.description || '').split('\n').find((l) => l.trim());
  const clean = stripLineMarker((firstLine || '').trim());
  if (!clean) return 'Untitled note';
  return clean.length > PREVIEW_LENGTH
    ? `${clean.slice(0, PREVIEW_LENGTH)}…`
    : clean;
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
// These are pure filters now — no baked-in sort order, since that's
// user-selectable (see sortItems below).

// Notes with a group_id don't get their own card on the main grid —
// their group represents them there instead. Trash is the one view
// that's an exception: a trashed note still shows individually there
// regardless of group_id, since that's what makes restore-to-group
// possible to see happening.
export function filterActive(notes) {
  return notes.filter((n) => !n.deleted_at && !n.is_archived && !n.group_id);
}

export function filterArchived(notes) {
  return notes.filter((n) => !n.deleted_at && n.is_archived && !n.group_id);
}

export function filterTrashed(notes) {
  return notes
    .filter((n) => !!n.deleted_at)
    .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

export function filterActiveGroups(groups) {
  return groups.filter((g) => !g.deleted_at && !g.is_archived);
}

export function filterArchivedGroups(groups) {
  return groups.filter((g) => !g.deleted_at && g.is_archived);
}

export function filterTrashedGroups(groups) {
  return groups
    .filter((g) => !!g.deleted_at)
    .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

// A group's own member list — always pinned-then-recency, no sort
// control inside a group view (out of scope for now, unlike the main
// grid).
export function notesInGroup(notes, groupId) {
  return notes
    .filter((n) => n.group_id === groupId && !n.deleted_at)
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
}

// Combines already-filtered notes and groups into one list of display
// items, tagging each with its type so NoteGrid knows whether to
// render a NoteCard or a GroupCard. No sorting here — see sortItems.
export function mergeNotesAndGroups(notes, groups, allNotes) {
  return [
    ...notes.map((note) => ({ type: 'note', note })),
    ...groups.map((group) => ({ type: 'group', group, members: notesInGroup(allNotes, group.id) })),
  ];
}

// Sorts merged items by the chosen field/direction — pinned items
// always sort as their own group ahead of everything else, regardless
// of which field or direction is active; the field/direction only
// decides order *within* the pinned and unpinned groups.
export function sortItems(items, sortBy, sortDir) {
  const isPinned = (item) => (item.type === 'note' ? item.note.is_pinned : item.group.is_pinned);
  const sortValue = (item) => {
    if (sortBy === 'name') {
      return (item.type === 'note' ? displayTitle(item.note) : item.group.title).toLowerCase();
    }
    const entity = item.type === 'note' ? item.note : item.group;
    return sortBy === 'created' ? entity.created_at : entity.updated_at;
  };

  return [...items].sort((a, b) => {
    const aPinned = isPinned(a);
    const bPinned = isPinned(b);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const av = sortValue(a);
    const bv = sortValue(b);
    const cmp = sortBy === 'name' ? av.localeCompare(bv) : new Date(av) - new Date(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

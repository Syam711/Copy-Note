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
  const title = ''; //note.title?.trim();  No need to add the title
  const description = note.description?.trim() || '';
  return title ? `${title}\n${description}` : description;
}

// --- Shared view selectors ---------------------------------------
// The notes store holds one flat, unfiltered array; every page derives
// its own view from it with these, so there's a single definition of
// "what counts as active/archived/trashed" instead of one per page.

function byPinnedThenRecency(a, b) {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  return new Date(b.updated_at) - new Date(a.updated_at);
}

export function filterActive(notes) {
  return notes
    .filter((n) => !n.deleted_at && !n.is_archived)
    .sort(byPinnedThenRecency);
}

export function filterArchived(notes) {
  return notes
    .filter((n) => !n.deleted_at && n.is_archived)
    .sort(byPinnedThenRecency);
}

export function filterTrashed(notes) {
  return notes
    .filter((n) => !!n.deleted_at)
    .sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

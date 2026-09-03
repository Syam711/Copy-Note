import NoteCard from './NoteCard';
import GroupCard from './GroupCard';

// `items` is the output of utils/noteHelpers.mergeNotesAndGroups —
// tagged with type, sorted separately. selectedIds is a single Set
// covering both note and group ids, since one selection mode spans
// both card types on the same grid.
//
// CSS multi-column layout, not CSS Grid — this is deliberate, not
// just a Keep-style visual preference. Grid's default
// `align-items: stretch` makes every item in a row match the row's
// TALLEST item, which is exactly what broke the group-stack visual
// (its decorative layers use `inset: 0` against their own wrapper, so
// a stretched wrapper stretched them too, driven by an unrelated tall
// note elsewhere in the same row). Columns don't have "rows" to
// stretch to — each card sizes to its own content, and taller/shorter
// cards pack together without leaving gaps, closer to how Keep
// actually lays notes out.
//
// One honest trade-off: this is column-by-column filling (fill
// column 1 top-to-bottom, then column 2, ...), not true
// shortest-column-first masonry. Real masonry needs either
// JS-measured placement or the `grid-template-rows: masonry` CSS
// feature, which isn't reliably supported across browsers yet. This
// is the simple, dependency-free version — good enough once card
// heights are reasonably bounded (see the max-height + fade in
// NoteCard), not pixel-identical to Keep's algorithm.
export default function NoteGrid({
  items,
  onOpenNote,
  onOpenGroup,
  emptyMessage = 'Nothing here yet.',
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onCtrlSelect,
}) {
  if (items.length === 0) {
    return <p className="text-stone-400 text-sm mt-10 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
      {items.map((item) => (
        <div
          key={item.type === 'group' ? item.group.id : item.note.id}
          className="break-inside-avoid mb-4"
        >
          {item.type === 'group' ? (
            <GroupCard
              group={item.group}
              members={item.members}
              onOpen={onOpenGroup}
              selectionMode={selectionMode}
              selected={selectedIds?.has(item.group.id)}
              onToggleSelect={onToggleSelect}
              onCtrlSelect={onCtrlSelect}
            />
          ) : (
            <NoteCard
              note={item.note}
              onOpen={onOpenNote}
              selectionMode={selectionMode}
              selected={selectedIds?.has(item.note.id)}
              onToggleSelect={onToggleSelect}
              onCtrlSelect={onCtrlSelect}
            />
          )}
        </div>
      ))}
    </div>
  );
}
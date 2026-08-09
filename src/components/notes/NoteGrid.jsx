import NoteCard from './NoteCard';
import GroupCard from './GroupCard';

// `items` is the output of utils/noteHelpers.mergeNotesAndGroups —
// already sorted, each tagged with its type. selectedIds is a single
// Set covering both note and group ids, since one selection mode
// spans both card types on the same grid.
export default function NoteGrid({
  items,
  onOpenNote,
  onOpenGroup,
  emptyMessage = 'Nothing here yet.',
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}) {
  if (items.length === 0) {
    return <p className="text-stone-400 text-sm mt-10 text-center">{emptyMessage}</p>;
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      style={{ perspective: '900px' }} // shared 3D context so every card's tilt reads consistently
    >
      {items.map((item) =>
        item.type === 'group' ? (
          <GroupCard
            key={item.group.id}
            group={item.group}
            members={item.members}
            onOpen={onOpenGroup}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.group.id)}
            onToggleSelect={onToggleSelect}
          />
        ) : (
          <NoteCard
            key={item.note.id}
            note={item.note}
            onOpen={onOpenNote}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.note.id)}
            onToggleSelect={onToggleSelect}
          />
        )
      )}
    </div>
  );
}

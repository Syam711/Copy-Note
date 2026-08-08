import NoteCard from './NoteCard';

export default function NoteGrid({
  notes,
  onOpenNote,
  emptyMessage = 'Nothing here yet.',
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}) {
  if (notes.length === 0) {
    return <p className="text-stone-400 text-sm mt-10 text-center">{emptyMessage}</p>;
  }

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      style={{ perspective: '900px' }} // shared 3D context so every card's tilt reads consistently
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onOpen={onOpenNote}
          selectionMode={selectionMode}
          selected={selectedIds?.has(note.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

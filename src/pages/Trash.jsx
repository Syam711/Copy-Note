import { useMemo } from 'react';
import { useNotesStore } from '../store/notesStore';
import { useToastStore } from '../store/toastStore';
import { filterTrashed, displayTitle } from '../utils/noteHelpers';
import { daysUntilPurge } from '../utils/trashHelpers';
import Icon from '../components/icons/Icon';

export default function Trash() {
  const allNotes = useNotesStore((s) => s.notes);
  const notes = useMemo(() => filterTrashed(allNotes), [allNotes]);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const permanentlyDelete = useNotesStore((s) => s.permanentlyDelete);
  const showToast = useToastStore((s) => s.showToast);

  if (notes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-stone-400 text-sm mt-10 text-center">Trash is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <p className="text-stone-400 text-xs mb-4">Notes are removed for good 30 days after deletion.</p>
      <ul className="flex flex-col gap-2">
        {notes.map((note) => {
          const title = displayTitle(note);
          const daysLeft = daysUntilPurge(note.deleted_at);
          return (
            <li key={note.id} className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm text-stone-800 truncate">{title}</p>
                <p className="text-xs text-stone-400">{daysLeft} day{daysLeft === 1 ? '' : 's'} left</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Restore"
                  onClick={() => { restoreNote(note.id); showToast('restore', title); }}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                >
                  <Icon name="undo" size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Delete forever"
                  onClick={() => permanentlyDelete(note.id)}
                  className="p-2 rounded-full hover:bg-rose-50 text-rose-500"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useMemo, useState } from 'react';
import NoteGrid from '../components/notes/NoteGrid';
import NoteEditor from '../components/notes/NoteEditor';
import TitleFilter from '../components/notes/TitleFilter';
import BulkActionBar from '../components/notes/BulkActionBar';
import Icon from '../components/icons/Icon';
import { useNotesStore } from '../store/notesStore';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useSelection } from '../hooks/useSelection';
import { filterActive, displayTitle } from '../utils/noteHelpers';
import { createShare, shareUrl } from '../api/share.api';

export default function Home() {
  const allNotes = useNotesStore((s) => s.notes);
  const loading = useNotesStore((s) => s.loading);
  const trashNote = useNotesStore((s) => s.trashNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  const [openNote, setOpenNote] = useState(null);
  const [query, setQuery] = useState('');
  const selection = useSelection();

  // Filters against the same title-or-first-lines text the card
  // itself displays, not just the raw title field — otherwise a note
  // with no title could never be found even though it clearly shows
  // text where a title would go.
  const notes = useMemo(() => {
    const active = filterActive(allNotes);
    if (!query.trim()) return active;
    const q = query.trim().toLowerCase();
    return active.filter((n) => displayTitle(n).toLowerCase().includes(q));
  }, [allNotes, query]);

  const plural = (n) => `${n} note${n === 1 ? '' : 's'}`;

  const handleBulkArchive = () => {
    selection.selectedIds.forEach((id) => toggleArchive(id, true));
    showToast('archive', plural(selection.count));
    selection.exit();
  };

  const handleBulkDelete = () => {
    selection.selectedIds.forEach((id) => trashNote(id));
    showToast('delete', plural(selection.count));
    selection.exit();
  };

  const handleBulkShare = async () => {
    if (isGuest) {
      showToast('shareRequiresAccount');
      return;
    }
    const targets = notes.filter((n) => selection.selectedIds.has(n.id));
    try {
      const shares = await Promise.all(targets.map((n) => createShare(n, user)));
      const links = shares.map((s) => shareUrl(s.share_token)).join('\n');
      await navigator.clipboard.writeText(links);
      showToast('bulkShare', shares.length);
    } catch (err) {
      console.error('Bulk share failed:', err);
    }
    selection.exit();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setOpenNote({ note: null, rect: null })}
          className="flex-1 sm:flex-none sm:w-72 text-left text-stone-400 text-sm bg-white border border-stone-200 rounded-2xl px-4 py-3 hover:shadow-sm transition-shadow"
        >
          Take a note…
        </button>
        <TitleFilter query={query} onQueryChange={setQuery} />
        <button
          type="button"
          onClick={selection.active ? selection.exit : selection.enter}
          aria-label={selection.active ? 'Exit selection' : 'Select notes'}
          className={`p-2.5 rounded-full border shrink-0 ${
            selection.active ? 'bg-teal-600 border-teal-600 text-white' : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Icon name="select" size={16} />
        </button>
      </div>

      {loading ? (
        <p className="text-stone-400 text-sm">Loading your notes…</p>
      ) : (
        <NoteGrid
          notes={notes}
          onOpenNote={(note, rect) => setOpenNote({ note, rect })}
          selectionMode={selection.active}
          selectedIds={selection.selectedIds}
          onToggleSelect={selection.toggle}
          emptyMessage={query ? 'No notes match that title.' : "No notes yet — click 'Take a note…' to add one."}
        />
      )}

      {openNote && (
        <NoteEditor
          note={openNote.note}
          originRect={openNote.rect}
          onClose={() => setOpenNote(null)}
        />
      )}

      <BulkActionBar
        count={selection.count}
        onArchive={handleBulkArchive}
        onShare={handleBulkShare}
        onDelete={handleBulkDelete}
        onCancel={selection.exit}
      />
    </div>
  );
}

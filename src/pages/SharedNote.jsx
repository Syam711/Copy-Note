import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Icon from '../components/icons/Icon';
import { fetchShareByToken } from '../api/share.api';
import { useNotesStore } from '../store/notesStore';
import { useGroupsStore } from '../store/groupsStore';
import { useToastStore } from '../store/toastStore';

// share.notes is an array — one item for a single-note share, several
// for a multi-select or group share (share.group_title set for the
// latter). Import works the same regardless of which kind it is —
// that's the "works for all types of shared notes" requirement.
export default function SharedNote() {
  const { token } = useParams();
  const [share, setShare] = useState(undefined); // undefined = loading, null = not found
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);

  const createNote = useNotesStore((s) => s.createNote);
  const createGroupFromNotes = useGroupsStore((s) => s.createGroupFromNotes);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    fetchShareByToken(token)
      .then(setShare)
      .catch((err) => {
        console.error('Failed to load shared note:', err);
        setShare(null);
      });
  }, [token]);

  if (share === undefined) {
    return <CenteredMessage text="Loading…" />;
  }

  if (share === null || share.notes.length === 0) {
    return <CenteredMessage text="This link doesn't point to anything — it may have been revoked." />;
  }

  const label = share.group_title ? `"${share.group_title}"` : share.notes.length === 1 ? `"${share.notes[0].title || 'note'}"` : `${share.notes.length} notes`;

  // Import works for a guest (creates local-only notes, same as
  // anything else a guest creates) or a signed-in account — whichever
  // owns this browser session already, via notesStore/groupsStore
  // being initialized the same way on every page, not just the main app.
  const handleImport = async () => {
    setImporting(true);
    try {
      const created = [];
      for (const note of share.notes) {
        // eslint-disable-next-line no-await-in-loop
        const result = await createNote({ title: note.title, description: note.description });
        if (result) created.push(result);
      }
      if (share.group_title && created.length > 0) {
        await createGroupFromNotes(created.map((n) => n.id), share.group_title);
      }
      showToast('import', label);
      setImported(true);
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-start justify-between gap-3 mb-1">
          {share.group_title ? (
            <h1 className="font-serif text-2xl text-stone-800">{share.group_title}</h1>
          ) : share.notes.length > 1 ? (
            <h1 className="font-serif text-2xl text-stone-800">{share.notes.length} shared notes</h1>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={importing || imported}
            aria-label="Import into your notes"
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
              imported ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60'
            }`}
          >
            <Icon name={imported ? 'check' : 'import'} size={14} />
            {imported ? 'Imported' : importing ? 'Importing…' : 'Import'}
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-6">
          {share.notes.length} note{share.notes.length === 1 ? '' : 's'} · shared by {share.shared_by_name} ·{' '}
          {new Date(share.shared_at).toLocaleDateString()}
        </p>

        <div className="flex flex-col gap-6">
          {share.notes.map((note, i) => (
            <div key={i} className={i > 0 ? 'pt-6 border-t border-stone-100' : ''}>
              {note.title && <h2 className="font-serif text-lg text-stone-800 mb-2">{note.title}</h2>}
              <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{note.description}</p>
            </div>
          ))}
        </div>
      </div>
      <Link to="/" className="text-xs text-stone-400 hover:text-stone-600 mt-6">
        Made with Notes — create your own
      </Link>
    </div>
  );
}

function CenteredMessage({ text }) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <p className="text-stone-400 text-sm">{text}</p>
    </div>
  );
}

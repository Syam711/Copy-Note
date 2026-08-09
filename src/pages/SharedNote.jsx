import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchShareByToken } from '../api/share.api';

// share.notes is an array — one item for a single-note share, several
// for a multi-select or group share (share.group_title set for the
// latter).
export default function SharedNote() {
  const { token } = useParams();
  const [share, setShare] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    fetchShareByToken(token)
      .then(setShare)
      .catch(() => setShare(null));
  }, [token]);

  if (share === undefined) {
    return <CenteredMessage text="Loading…" />;
  }

  if (share === null || share.notes.length === 0) {
    return <CenteredMessage text="This link doesn't point to anything — it may have been revoked." />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
        {share.group_title && (
          <h1 className="font-serif text-2xl text-stone-800 mb-1">{share.group_title}</h1>
        )}
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SharedNoteCard from '../components/notes/SharedNoteCard';
import { useAuthStore } from '../store/authStore';
import { fetchSharesByUser } from '../api/share.api';

export default function SharedNotes() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const [shares, setShares] = useState(null); // null = loading

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    fetchSharesByUser(user.id)
      .then(setShares)
      .catch((err) => {
        console.error('Failed to load shared notes:', err);
        setShares([]);
      });
  }, [status, user]);

  const handleRevoked = (shareId) => {
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  };

  if (status === 'guest') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-center">
        <p className="text-stone-500 text-sm mb-3">Sharing requires an account.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-full text-sm bg-teal-600 text-white hover:bg-teal-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {shares === null ? (
        <p className="text-stone-400 text-sm">Loading shared notes…</p>
      ) : shares.length === 0 ? (
        <p className="text-stone-400 text-sm mt-10 text-center">
          Notes you share will show up here.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" style={{ perspective: '900px' }}>
          {shares.map((share) => (
            <SharedNoteCard key={share.id} share={share} onRevoked={handleRevoked} />
          ))}
        </div>
      )}
    </div>
  );
}

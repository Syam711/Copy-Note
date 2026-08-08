import { useEffect, useState } from 'react';
import { db } from '../../db/localDb';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { clearGuestId } from '../../utils/localFlags';

// Deliberately checks localStorage directly rather than trusting
// in-memory state — this needs to work whether the import happens
// seconds after sign-up (instant session) or minutes later after an
// email-confirmation link, in a fresh page load.
export default function ImportGuestNotesPrompt() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const importGuestNotes = useNotesStore((s) => s.importGuestNotes);
  const [pending, setPending] = useState(null); // { guestId, count } | null

  useEffect(() => {
    if (status !== 'authenticated') return;
    const guestId = localStorage.getItem('notesApp:guestId');
    if (!guestId) return;
    db.notes.where('user_id').equals(guestId).count().then((count) => {
      if (count > 0) setPending({ guestId, count });
    });
  }, [status]);

  if (!pending) return null;

  const handleImport = async () => {
    await importGuestNotes(pending.guestId, user.id);
    clearGuestId();
    setPending(null);
  };

  const handleDismiss = () => {
    clearGuestId();
    setPending(null);
  };

  return (
    <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-40 bg-white border border-stone-200 rounded-2xl shadow-lg p-4">
      <p className="text-sm text-stone-800 mb-1">Bring your notes with you?</p>
      <p className="text-sm text-stone-500 mb-3">
        You have {pending.count} note{pending.count === 1 ? '' : 's'} saved on this device from before signing in.
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={handleDismiss} className="px-3 py-1.5 rounded-full text-sm text-stone-500 hover:bg-stone-100">
          Leave them
        </button>
        <button type="button" onClick={handleImport} className="px-3 py-1.5 rounded-full text-sm bg-teal-600 text-white hover:bg-teal-700">
          Import
        </button>
      </div>
    </div>
  );
}

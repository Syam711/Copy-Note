import { useEffect, useState } from 'react';
import { db } from '../../db/localDb';
import { useAuthStore } from '../../store/authStore';
import { useNotesStore } from '../../store/notesStore';
import { useGroupsStore } from '../../store/groupsStore';
import { clearGuestId } from '../../utils/localFlags';

// Deliberately checks localStorage directly rather than trusting
// in-memory state — this needs to work whether the import happens
// seconds after sign-up (instant session) or minutes later after an
// email-confirmation link, in a fresh page load.
export default function ImportGuestNotesPrompt() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const importGuestNotes = useNotesStore((s) => s.importGuestNotes);
  const importGuestGroups = useGroupsStore((s) => s.importGuestGroups);
  const [pending, setPending] = useState(null); // { guestId, noteCount, groupCount } | null

  useEffect(() => {
    if (status !== 'authenticated') return;
    const guestId = localStorage.getItem('notesApp:guestId');
    if (!guestId) return;
    Promise.all([
      db.notes.where('user_id').equals(guestId).count(),
      db.groups.where('user_id').equals(guestId).count(),
    ]).then(([noteCount, groupCount]) => {
      if (noteCount > 0 || groupCount > 0) setPending({ guestId, noteCount, groupCount });
    });
  }, [status]);

  if (!pending) return null;

  // Note and group ids are unaffected by this — only each row's
  // user_id changes — so a note's group_id still points to the right
  // group after both imports run, in either order.
  const handleImport = async () => {
    await Promise.all([
      importGuestNotes(pending.guestId, user.id),
      importGuestGroups(pending.guestId, user.id),
    ]);
    clearGuestId();
    setPending(null);
  };

  const handleDismiss = () => {
    clearGuestId();
    setPending(null);
  };

  const total = pending.noteCount + pending.groupCount;

  return (
    <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:w-96 z-40 bg-white border border-stone-200 rounded-2xl shadow-lg p-4">
      <p className="text-sm text-stone-800 mb-1">Bring your notes with you?</p>
      <p className="text-sm text-stone-500 mb-3">
        You have {total} item{total === 1 ? '' : 's'} saved on this device from before signing in.
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

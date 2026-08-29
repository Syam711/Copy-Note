import { useMemo, useState } from 'react';
import { useNotesStore } from '../store/notesStore';
import { useGroupsStore } from '../store/groupsStore';
import { useToastStore } from '../store/toastStore';
import { filterTrashed, filterTrashedGroups, displayTitle } from '../utils/noteHelpers';
import { daysUntilPurge } from '../utils/trashHelpers';
import Icon from '../components/icons/Icon';

export default function Trash() {
  const [tab, setTab] = useState('notes'); // 'notes' | 'groups'

  const allNotes = useNotesStore((s) => s.notes);
  const notes = useMemo(() => filterTrashed(allNotes), [allNotes]);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const permanentlyDelete = useNotesStore((s) => s.permanentlyDelete);

  const allGroups = useGroupsStore((s) => s.groups);
  const groups = useMemo(() => filterTrashedGroups(allGroups), [allGroups]);
  const restoreGroup = useGroupsStore((s) => s.restoreGroup);
  const permanentlyDeleteGroup = useGroupsStore((s) => s.permanentlyDeleteGroup);

  const showToast = useToastStore((s) => s.showToast);

  const items = tab === 'notes' ? notes : groups;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => setTab('notes')}
          className={`px-3 py-1.5 rounded-full text-sm ${tab === 'notes' ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
        >
          Notes ({notes.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('groups')}
          className={`px-3 py-1.5 rounded-full text-sm ${tab === 'groups' ? 'bg-teal-600 text-white' : 'text-stone-600 hover:bg-stone-200'}`}
        >
          Groups ({groups.length})
        </button>
      </div>

      <p className="text-stone-400 text-xs mb-4">
        {tab === 'notes' ? 'Notes' : 'Groups (and their notes)'} are removed for good 30 days after deletion.
      </p>

      {items.length === 0 ? (
        <p className="text-stone-400 text-sm mt-10 text-center">
          {tab === 'notes' ? 'No deleted notes.' : 'No deleted groups.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const title = tab === 'notes' ? displayTitle(item) : item.title;
            const daysLeft = daysUntilPurge(item.deleted_at);
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-stone-800 truncate">{title}</p>
                  <p className="text-xs text-stone-400">{daysLeft} day{daysLeft === 1 ? '' : 's'} left</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Restore"
                    onClick={() => {
                      if (tab === 'notes') restoreNote(item.id);
                      else restoreGroup(item.id);
                      showToast('restore', title);
                    }}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-500"
                  >
                    <Icon name="undo" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete forever"
                    onClick={() => (tab === 'notes' ? permanentlyDelete(item.id) : permanentlyDeleteGroup(item.id))}
                    className="p-2 rounded-full hover:bg-rose-50 text-rose-500"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import NoteGrid from '../components/notes/NoteGrid';
import NoteEditor from '../components/notes/NoteEditor';
import GroupOpenView from '../components/notes/GroupOpenView';
import TitleFilter from '../components/notes/TitleFilter';
import BulkActionBar from '../components/notes/BulkActionBar';
import Icon from '../components/icons/Icon';
import { useNotesStore } from '../store/notesStore';
import { useGroupsStore } from '../store/groupsStore';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { useSelection } from '../hooks/useSelection';
import { filterActive, filterActiveGroups, displayTitle, mergeNotesAndGroups } from '../utils/noteHelpers';
import { createShare, shareUrl } from '../api/share.api';

export default function Home() {
  const allNotes = useNotesStore((s) => s.notes);
  const loading = useNotesStore((s) => s.loading);
  const trashNote = useNotesStore((s) => s.trashNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);

  const allGroups = useGroupsStore((s) => s.groups);
  const toggleGroupArchive = useGroupsStore((s) => s.toggleArchive);
  const formGroupFromSelection = useGroupsStore((s) => s.formGroupFromSelection);
  const ungroup = useGroupsStore((s) => s.ungroup);

  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  const [openNote, setOpenNote] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [query, setQuery] = useState('');
  const selection = useSelection();

  const items = useMemo(() => {
    const activeNotes = filterActive(allNotes);
    const activeGroups = filterActiveGroups(allGroups);
    const merged = mergeNotesAndGroups(activeNotes, activeGroups, allNotes);
    if (!query.trim()) return merged;
    const q = query.trim().toLowerCase();
    return merged.filter((item) =>
      item.type === 'note' ? displayTitle(item.note).toLowerCase().includes(q) : item.group.title.toLowerCase().includes(q)
    );
  }, [allNotes, allGroups, query]);

  // Classify the current selection so bulk actions can be enabled per
  // the composition rules worked out in the architecture discussion.
  const selectedNoteIds = useMemo(
    () => Array.from(selection.selectedIds).filter((id) => allNotes.some((n) => n.id === id)),
    [selection.selectedIds, allNotes]
  );
  const selectedGroupIds = useMemo(
    () => Array.from(selection.selectedIds).filter((id) => allGroups.some((g) => g.id === id)),
    [selection.selectedIds, allGroups]
  );
  const hasNotes = selectedNoteIds.length > 0;
  const hasGroups = selectedGroupIds.length > 0;
  const mixed = hasNotes && hasGroups;

  const plural = (n) => `${n} item${n === 1 ? '' : 's'}`;

  const handleBulkArchive = () => {
    selectedNoteIds.forEach((id) => toggleArchive(id, true));
    selectedGroupIds.forEach((id) => toggleGroupArchive(id, true));
    showToast('archive', plural(selection.count));
    selection.exit();
  };

  const handleBulkGroup = () => {
    formGroupFromSelection(selectedNoteIds, selectedGroupIds);
    selection.exit();
  };

  // Notes-only -> trash them. Groups-only -> ungroup them. Mixed is
  // unreachable here (the button isn't rendered), but guarded anyway.
  const handleBulkDelete = () => {
    if (mixed) return;
    if (hasGroups) {
      selectedGroupIds.forEach((id) => ungroup(id));
      showToast('ungroup', plural(selectedGroupIds.length));
    } else {
      selectedNoteIds.forEach((id) => trashNote(id));
      showToast('delete', plural(selectedNoteIds.length));
    }
    selection.exit();
  };

  // A single group, or any number of individual notes — never mixed,
  // never multiple groups. See handleBulkShare's caller for how the
  // button itself is conditionally rendered to match this.
  const handleBulkShare = async () => {
    if (isGuest) {
      showToast('shareRequiresAccount');
      return;
    }
    try {
      if (selectedGroupIds.length === 1) {
        const group = allGroups.find((g) => g.id === selectedGroupIds[0]);
        const members = allNotes.filter((n) => n.group_id === group.id);
        const share = await createShare(members, user, group.title);
        await navigator.clipboard.writeText(shareUrl(share.share_token));
        showToast('share', group.title);
      } else {
        const targets = allNotes.filter((n) => selectedNoteIds.includes(n.id));
        const share = await createShare(targets, user, null);
        await navigator.clipboard.writeText(shareUrl(share.share_token));
        showToast('share', plural(targets.length));
      }
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
          items={items}
          onOpenNote={(note, rect) => setOpenNote({ note, rect })}
          onOpenGroup={(group, rect) => setOpenGroup({ group, rect })}
          selectionMode={selection.active}
          selectedIds={selection.selectedIds}
          onToggleSelect={selection.toggle}
          emptyMessage={query ? 'Nothing matches that title.' : "No notes yet — click 'Take a note…' to add one."}
        />
      )}

      {openNote && (
        <NoteEditor note={openNote.note} originRect={openNote.rect} onClose={() => setOpenNote(null)} />
      )}
      {openGroup && (
        <GroupOpenView group={openGroup.group} originRect={openGroup.rect} onClose={() => setOpenGroup(null)} />
      )}

      <BulkActionBar
        count={selection.count}
        onArchive={handleBulkArchive}
        onGroup={handleBulkGroup}
        onDelete={mixed ? undefined : handleBulkDelete}
        deleteLabel={hasGroups && !hasNotes ? 'Ungroup' : 'Delete'}
        onShare={!mixed && selectedGroupIds.length <= 1 ? handleBulkShare : undefined}
        onCancel={selection.exit}
      />
    </div>
  );
}

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import NoteCard from './NoteCard';
import NoteEditor from './NoteEditor';
import { useGroupsStore } from '../../store/groupsStore';
import { useNotesStore } from '../../store/notesStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useSelection } from '../../hooks/useSelection';
import { useClickOutside } from '../../hooks/useClickOutside';
import { notesInGroup, displayTitle } from '../../utils/noteHelpers';
import { createShare, shareUrl } from '../../api/share.api';

const TRANSITION_MS = 380;

export default function GroupOpenView({ group, originRect, onClose }) {
  const [title, setTitle] = useState(group.title);
  const [phase, setPhase] = useState('enter');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openNote, setOpenNote] = useState(null); // editing one member note, nested on top

  const menuRef = useRef(null);
  const allNotes = useNotesStore((s) => s.notes);
  const members = useMemo(() => notesInGroup(allNotes, group.id), [allNotes, group.id]);

  const renameGroup = useGroupsStore((s) => s.renameGroup);
  const toggleArchive = useGroupsStore((s) => s.toggleArchive);
  const ungroup = useGroupsStore((s) => s.ungroup);
  const removeNotesFromGroup = useGroupsStore((s) => s.removeNotesFromGroup);
  const formGroupFromSelection = useGroupsStore((s) => s.formGroupFromSelection);
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  const selection = useSelection();

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(async () => {
    if (title.trim() && title.trim() !== group.title) {
      await renameGroup(group.id, title.trim());
    }
    setPhase('exit');
    setTimeout(onClose, TRANSITION_MS);
  }, [title, group, renameGroup, onClose]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !openNote) handleClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, openNote]);

  const handleArchiveToggle = () => {
    setMenuOpen(false);
    const willArchive = !group.is_archived;
    toggleArchive(group.id, willArchive);
    showToast(willArchive ? 'archive' : 'restore', group.title);
  };

  const handleUngroup = () => {
    setMenuOpen(false);
    ungroup(group.id);
    showToast('ungroup', group.title);
    setPhase('exit');
    setTimeout(onClose, TRANSITION_MS);
  };

  const handleShare = async () => {
    setMenuOpen(false);
    if (isGuest) {
      showToast('shareRequiresAccount');
      return;
    }
    try {
      const share = await createShare(members, user, group.title);
      await navigator.clipboard.writeText(shareUrl(share.share_token));
      showToast('share', group.title);
    } catch (err) {
      console.error('Failed to create group share:', err);
    }
  };

  const handleRemoveOne = (noteId) => {
    const note = members.find((n) => n.id === noteId);
    removeNotesFromGroup([noteId]);
    showToast('ungroup', note ? displayTitle(note) : 'note');
  };

  const handleBulkRemove = () => {
    const count = selection.count;
    removeNotesFromGroup(Array.from(selection.selectedIds));
    showToast('ungroup', `${count} note${count === 1 ? '' : 's'}`);
    selection.exit();
  };

  // Pulls the selected member notes out into a brand-new group of
  // their own — "grouping notes inside the group," not nesting.
  const handleBulkRegroup = () => {
    formGroupFromSelection(Array.from(selection.selectedIds), []);
    selection.exit();
  };

  // --- FLIP-lite geometry, same approach as NoteEditor — a bit wider
  // by default since this shows a grid, not a single column of text.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const expandedWidth = Math.min(720, vw * 0.94);
  const expandedHeight = Math.min(680, vh * 0.86);
  const expanded = {
    top: (vh - expandedHeight) / 2,
    left: (vw - expandedWidth) / 2,
    width: expandedWidth,
    height: expandedHeight,
    borderRadius: 20,
  };
  const collapsed = originRect
    ? { top: originRect.top, left: originRect.left, width: originRect.width, height: originRect.height, borderRadius: 16 }
    : { top: vh / 2 - 60, left: vw / 2 - 160, width: 320, height: 120, borderRadius: 16 };

  const geometry = phase === 'open' ? expanded : collapsed;
  const panelStyle = { position: 'fixed', ...geometry };

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-stone-900 transition-opacity"
        style={{ opacity: phase === 'open' ? 0.35 : 0, transitionDuration: `${TRANSITION_MS}ms` }}
        onClick={handleClose}
      />
      <div
        style={panelStyle}
        className={`editor-panel bg-stone-50 shadow-2xl overflow-hidden flex flex-col ${phase === 'enter' ? 'editor-panel--no-transition' : ''}`}
      >
        <div
          className="flex items-center justify-between gap-2 px-4 pt-3 shrink-0 transition-opacity"
          style={{ opacity: phase === 'open' ? 1 : 0, transitionDelay: phase === 'open' ? '120ms' : '0ms' }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-serif text-lg text-stone-800 bg-transparent outline-none flex-1 min-w-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="Group options"
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500"
              >
                <Icon name="more" size={18} />
              </button>
              {menuOpen && (
                <div className="absolute top-9 right-0 w-36 rounded-xl bg-white shadow-lg border border-stone-200 py-1 z-10">
                  <MenuItem icon="share" label="Share" onClick={handleShare} />
                  <MenuItem
                    icon={group.is_archived ? 'restore' : 'archive'}
                    label={group.is_archived ? 'Unarchive' : 'Archive'}
                    onClick={handleArchiveToggle}
                  />
                  <MenuItem icon="trash" label="Ungroup" tone="danger" onClick={handleUngroup} />
                </div>
              )}
            </div>
            <button type="button" aria-label="Close" onClick={handleClose} className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pb-4 pt-3 transition-opacity"
          style={{ opacity: phase === 'open' ? 1 : 0, transitionDelay: phase === 'open' ? '150ms' : '0ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-stone-400">{members.length} note{members.length === 1 ? '' : 's'}</span>
            {members.length > 0 && (
              <button
                type="button"
                onClick={selection.active ? selection.exit : selection.enter}
                aria-label={selection.active ? 'Exit selection' : 'Select notes'}
                className={`p-2 rounded-full border ${
                  selection.active ? 'bg-teal-600 border-teal-600 text-white' : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-100'
                }`}
              >
                <Icon name="select" size={14} />
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <p className="text-stone-400 text-sm text-center mt-8">No notes left in this group.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ perspective: '900px' }}>
              {members.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onOpen={(n, rect) => setOpenNote({ note: n, rect })}
                  inGroupView
                  onRemoveFromGroup={handleRemoveOne}
                  selectionMode={selection.active}
                  selected={selection.selectedIds.has(note.id)}
                  onToggleSelect={selection.toggle}
                />
              ))}
            </div>
          )}
        </div>

        {selection.count > 0 && (
          <div className="shrink-0 flex items-center justify-center pb-4">
            <div className="flex items-center gap-1 bg-stone-800 text-stone-50 rounded-full pl-4 pr-2 py-2 shadow-lg">
              <span className="text-sm mr-2">{selection.count} selected</span>
              <button type="button" onClick={handleBulkRegroup} aria-label="Group into new group" className="p-2 rounded-full hover:bg-stone-700">
                <Icon name="group" size={16} />
              </button>
              <button type="button" onClick={handleBulkRemove} aria-label="Remove from group" className="p-2 rounded-full hover:bg-stone-700">
                <Icon name="undo" size={16} />
              </button>
              <button type="button" onClick={selection.exit} aria-label="Cancel" className="p-2 rounded-full hover:bg-stone-700">
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {openNote && (
        <NoteEditor note={openNote.note} originRect={openNote.rect} onClose={() => setOpenNote(null)} />
      )}
    </div>
  );
}

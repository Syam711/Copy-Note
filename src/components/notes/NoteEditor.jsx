import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import { useNotesStore } from '../../store/notesStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useMarkdownShortcuts } from '../../hooks/useMarkdownShortcuts';
import { displayTitle } from '../../utils/noteHelpers';
import { createShare, shareUrl } from '../../api/share.api';

const TRANSITION_MS = 380;

// note === null means "creating a new note"; originRect is the
// clicked card's getBoundingClientRect(), or null when there's no
// card to grow from (e.g. opening via the "new note" button).
// defaultGroupId only applies when creating (note === null) — set
// when opened via a group's own "Add note" button, so the note is
// grouped from its very first insert rather than a separate update
// afterward (same create-pre-grouped pattern used by import, avoids
// the same class of race).
export default function NoteEditor({ note, originRect, onClose, defaultGroupId = null }) {
  const [title, setTitle] = useState(note?.title || '');
  const [description, setDescription] = useState(note?.description || '');
  const markdownShortcuts = useMarkdownShortcuts(description, setDescription);
  const [phase, setPhase] = useState('enter'); // 'enter' -> 'open' -> 'exit'
  const [menuOpen, setMenuOpen] = useState(false);

  const panelRef = useRef(null);
  const menuRef = useRef(null);

  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const trashNote = useNotesStore((s) => s.trashNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);
  const togglePin = useNotesStore((s) => s.togglePin);
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  // Kick off the expand transition one frame after mount, so the
  // browser paints the collapsed (card-sized) state first — without
  // that first paint, there's nothing for the transition to animate
  // FROM, and it would just appear full-size instantly.
  useEffect(() => {
    const id = requestAnimationFrame(() => setPhase('open'));
    return () => cancelAnimationFrame(id);
  }, []);

  const persist = useCallback(async (fields) => {
    if (note) {
      await updateNote(note.id, fields);
    } else if (fields.title?.trim() || fields.description?.trim()) {
      await createNote({ ...fields, group_id: defaultGroupId });
    }
  }, [note, updateNote, createNote, defaultGroupId]);

  const handleClose = useCallback(async () => {
    await persist({ title, description }); // empty notes are discarded inside the store
    setPhase('exit');
    setTimeout(onClose, TRANSITION_MS);
  }, [persist, title, description, onClose]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (note) {
      trashNote(note.id);
      showToast('delete', displayTitle(note));
    }
    setPhase('exit');
    setTimeout(onClose, TRANSITION_MS);
  };

  const handleArchiveToggle = () => {
    setMenuOpen(false);
    if (!note) return;
    const willArchive = !note.is_archived;
    toggleArchive(note.id, willArchive);
    showToast(willArchive ? 'archive' : 'restore', displayTitle(note));
  };

  const handlePinToggle = () => {
    setMenuOpen(false);
    if (!note) return;
    togglePin(note.id, !note.is_pinned);
  };

  const handleShare = async () => {
    setMenuOpen(false);
    if (!note) return;
    if (isGuest) {
      showToast('shareRequiresAccount');
      return;
    }
    try {
      const share = await createShare([{ ...note, title, description }], user);
      await navigator.clipboard.writeText(shareUrl(share.share_token));
      showToast('share', displayTitle(note));
    } catch (err) {
      console.error('Failed to create share:', err);
    }
  };

  // --- FLIP-lite geometry -------------------------------------------
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const expandedWidth = Math.min(560, vw * 0.92);
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
    : { top: vh / 2 - 40, left: vw / 2 - 140, width: 280, height: 80, borderRadius: 16 }; // fallback: bloom from center

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={note ? 'Edit note' : 'New note'}
        style={panelStyle}
        className={`editor-panel bg-stone-50 shadow-2xl overflow-hidden flex flex-col ${phase === 'enter' ? 'editor-panel--no-transition' : ''}`}
      >
        <div
          className="flex items-center justify-end gap-1 px-3 pt-3 shrink-0 transition-opacity"
          style={{ opacity: phase === 'open' ? 1 : 0, transitionDelay: phase === 'open' ? '120ms' : '0ms' }}
        >
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Note options"
              onClick={() => setMenuOpen((o) => !o)}
              className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500"
            >
              <Icon name="more" size={18} />
            </button>
            {menuOpen && (
              <div className="absolute top-9 right-0 w-40 rounded-xl bg-white shadow-lg border border-stone-200 py-1 z-10">
                <MenuItem icon={note?.is_pinned ? 'unpin' : 'pin'} label={note?.is_pinned ? 'Unpin' : 'Pin'} onClick={handlePinToggle} />
                <MenuItem icon="share" label="Share" onClick={handleShare} />
                <MenuItem
                  icon={note?.is_archived ? 'restore' : 'archive'}
                  label={note?.is_archived ? 'Unarchive' : 'Archive'}
                  onClick={handleArchiveToggle}
                />
                <MenuItem icon="trash" label="Delete" tone="danger" onClick={handleDelete} />
              </div>
            )}
          </div>
          <button type="button" aria-label="Close" onClick={handleClose} className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 pb-6 pt-2 flex flex-col transition-opacity"
          style={{ opacity: phase === 'open' ? 1 : 0, transitionDelay: phase === 'open' ? '150ms' : '0ms' }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            autoFocus={!note}
            className="w-full shrink-0 font-serif text-xl text-stone-800 placeholder-stone-400 bg-transparent outline-none mb-3"
          />
          <textarea
            ref={markdownShortcuts.textareaRef}
            value={description}
            onChange={markdownShortcuts.onChange}
            onKeyDown={markdownShortcuts.onKeyDown}
            placeholder="Start writing… try '- ' for a list, '- [] ' for a checkbox"
            className="flex-1 w-full resize-none text-stone-700 leading-relaxed placeholder-stone-400 bg-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}

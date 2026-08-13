import { useRef, useState, useCallback, useEffect } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import { colorForNote } from './noteColors';
import RichDescription from './RichDescription';
import { displayTitle, copyableText } from '../../utils/noteHelpers';
import { toggleChecklistLine } from '../../utils/richText';
import { useNotesStore } from '../../store/notesStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useLongPress } from '../../hooks/useLongPress';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTilt } from '../../hooks/useTilt';
import { createShare, shareUrl } from '../../api/share.api';

const CLICK_DEBOUNCE_MS = 220; // gives a second click time to arrive before treating the first as final

export default function NoteCard({
  note,
  onOpen,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  inGroupView = false,
  onRemoveFromGroup,
}) {
  const cardRef = useRef(null);
  const menuRef = useRef(null);
  const clickTimer = useRef(null);
  const tilt = useTilt();
  const [menuOpen, setMenuOpen] = useState(false);

  const trashNote = useNotesStore((s) => s.trashNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);
  const toggleHidden = useNotesStore((s) => s.toggleHidden);
  const updateNote = useNotesStore((s) => s.updateNote);
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);
  useEffect(() => () => clearTimeout(clickTimer.current), []);

  const title = displayTitle(note);

  // Checking an item off doesn't open the editor or count as a copy —
  // it's its own thing, handled entirely by rewriting that one line
  // within the description text (see utils/richText.js).
  const handleToggleChecklist = useCallback(
    (lineIndex) => updateNote(note.id, { description: toggleChecklistLine(note.description, lineIndex) }),
    [note.id, note.description, updateNote]
  );

  // Every gesture that would normally open the editor toggles
  // selection instead while selection mode is active — opening an
  // editor mid-selection would be a confusing thing to land in.
  const triggerOpen = useCallback(() => {
    if (selectionMode) {
      onToggleSelect(note.id);
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    onOpen(note, rect);
  }, [selectionMode, onToggleSelect, note, onOpen]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyableText(note));
    } catch {
      // Clipboard permission denied or unavailable — the toast still
      // fires below so the user gets *some* feedback either way;
      // worth a manual re-check if copies seem to silently fail.
    }
    showToast('copy', title);
  }, [note, title, showToast]);

  // The gesture that would normally copy also toggles selection
  // while in selection mode — one primary action per mode, no
  // modifier keys to remember.
  const handlePrimaryTap = useCallback(() => {
    if (selectionMode) onToggleSelect(note.id);
    else handleCopy();
  }, [selectionMode, onToggleSelect, note.id, handleCopy]);

  // --- Desktop pointer handling -----------------------------------
  // A double-click always fires a plain click first. Debouncing the
  // single-click action (rather than checking e.detail) means a
  // genuine double-click never triggers an extra copy.
  const handleClick = useCallback(() => {
    if (selectionMode) {
      onToggleSelect(note.id);
      return;
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      return;
    }
    clickTimer.current = setTimeout(() => {
      handleCopy();
      clickTimer.current = null;
    }, CLICK_DEBOUNCE_MS);
  }, [selectionMode, onToggleSelect, note.id, handleCopy]);

  const handleDoubleClick = useCallback(() => {
    clearTimeout(clickTimer.current);
    clickTimer.current = null;
    triggerOpen();
  }, [triggerOpen]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault(); // no native browser menu — see architecture notes on this trade-off
    if (selectionMode) {
      onToggleSelect(note.id);
      return;
    }
    setMenuOpen(true);
  }, [selectionMode, onToggleSelect, note.id]);

  const handleMouseLeave = useCallback(() => {
    tilt.onMouseLeave();
    setMenuOpen(false);
  }, [tilt]);

  // --- Mobile: tap copies (or selects), long-press opens (or selects) ---
  const longPressHandlers = useLongPress(triggerOpen, handlePrimaryTap);

  // --- Menu actions --------------------------------------------------
  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    trashNote(note.id);
    showToast('delete', title);
  };

  const handleArchiveToggle = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    const willArchive = !note.is_archived;
    toggleArchive(note.id, willArchive);
    showToast(willArchive ? 'archive' : 'restore', title);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (isGuest) {
      showToast('shareRequiresAccount');
      return;
    }
    try {
      const share = await createShare([note], user);
      await navigator.clipboard.writeText(shareUrl(share.share_token));
      showToast('share', title);
    } catch (err) {
      console.error('Failed to create share:', err);
    }
  };

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={selectionMode ? `Note: ${title}. ${selected ? 'Selected' : 'Not selected'}.` : `Note: ${title}. Click to copy, double-click to open.`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => e.key === 'Enter' && triggerOpen()}
      {...longPressHandlers}
      className={`group relative cursor-pointer outline-none ${menuOpen ? 'z-20' : ''}`}
    >
      {/* The tilt transform lives on this inner box only. A CSS
          `transform` creates its own stacking context — if it were on
          this outer element, the menu below (a descendant) would be
          trapped inside that context and get painted UNDER sibling
          cards whenever it's tall enough to overflow this card's own
          box, regardless of its z-index. Keeping the transform one
          level in avoids that entirely. */}
      <div
        style={tilt.style}
        className={`tilt-card rounded-2xl p-4 will-change-transform transition-[min-height] duration-300 ease-out ${
          note.is_hidden ? 'min-h-[3rem]' : 'min-h-[9rem]'
        } ${colorForNote(note.id)} ${selected ? 'ring-2 ring-teal-600' : ''}`}
      >
        {note.title?.trim() && (
          <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-1 pr-6">{note.title}</p>
        )}
        {/* Untitled notes normally show their description styled as a
            title (see the else-branch below). Hidden, that description
            is about to collapse away — so this stands in as the title
            using the same title-or-first-lines text the card would
            otherwise fall back to. */}
        {!note.title?.trim() && note.is_hidden && (
          <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-1 pr-6">{title}</p>
        )}
        <div className={`note-description-collapse pr-6 ${note.is_hidden ? 'is-hidden' : ''}`}>
          <RichDescription
            description={note.description}
            interactive={!selectionMode}
            onToggleChecklist={handleToggleChecklist}
          />
        </div>
      </div>

      {selectionMode && (
        <div
          aria-hidden="true"
          className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
            selected ? 'bg-teal-600 border-teal-600' : 'bg-white/80 border-stone-300'
          }`}
        >
          {selected && <Icon name="check" size={12} className="text-white" />}
        </div>
      )}
      {!selectionMode && note.is_pinned && (
        <Icon name="pin" size={13} className="absolute top-3 left-3 text-stone-500" />
      )}

      {!selectionMode && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-1 transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-40 hover:!opacity-100'
          }`}
        >
          <button
            type="button"
            aria-label={note.is_hidden ? 'Show description' : 'Hide description'}
            onClick={(e) => { e.stopPropagation(); toggleHidden(note.id, !note.is_hidden); }}
            className="p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-600"
          >
            <Icon key={note.is_hidden ? 'closed' : 'open'} name={note.is_hidden ? 'eyeOff' : 'eye'} size={15} className="icon-pop" />
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label="Note options"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-600"
            >
              <Icon name="more" size={15} />
            </button>

            {menuOpen && (
              <div className="absolute top-9 right-0 w-40 rounded-xl bg-white shadow-lg border border-stone-200 py-1 text-sm z-10">
                <MenuItem icon="edit" label="Edit" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); triggerOpen(); }} />
                <MenuItem icon="share" label="Share" onClick={handleShare} />
                {inGroupView ? (
                  <MenuItem
                    icon="close"
                    label="Remove from group"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onRemoveFromGroup(note.id); }}
                  />
                ) : (
                  <MenuItem
                    icon={note.is_archived ? 'restore' : 'archive'}
                    label={note.is_archived ? 'Unarchive' : 'Archive'}
                    onClick={handleArchiveToggle}
                  />
                )}
                <MenuItem icon="trash" label="Delete" tone="danger" onClick={handleDelete} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState, useCallback, useEffect } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import { colorForNote } from './noteColors';
import { useGroupsStore } from '../../store/groupsStore';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { useLongPress } from '../../hooks/useLongPress';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTilt } from '../../hooks/useTilt';
import { useFixedMenuPosition } from '../../hooks/useFixedMenuPosition';
import { createShare, shareUrl } from '../../api/share.api';

// `members` — this group's own notes, passed down from the page so
// GroupCard doesn't need its own data-fetching logic.
export default function GroupCard({ group, members, onOpen, selectionMode = false, selected = false, onToggleSelect, onCtrlSelect }) {
  const cardRef = useRef(null);
  const menuRef = useRef(null);
  const tilt = useTilt();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { buttonRef: menuButtonRef, style: menuStyle } = useFixedMenuPosition(menuOpen, closeMenu);

  const toggleArchive = useGroupsStore((s) => s.toggleArchive);
  const ungroup = useGroupsStore((s) => s.ungroup);
  const trashGroup = useGroupsStore((s) => s.trashGroup);
  const showToast = useToastStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.status === 'guest');

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const triggerOpen = useCallback(() => {
    if (selectionMode) {
      onToggleSelect(group.id);
      return;
    }
    const rect = cardRef.current.getBoundingClientRect();
    onOpen(group, rect);
  }, [selectionMode, onToggleSelect, group, onOpen]);

  // Copying a whole group isn't supported — only individual notes can
  // be copied, whether standalone or from inside an opened group. So
  // unlike NoteCard, a group's primary tap/click gesture has nothing
  // to fall back to outside of selection mode; it's simply a no-op.
  const handlePrimaryTap = useCallback(() => {
    if (selectionMode) onToggleSelect(group.id);
  }, [selectionMode, onToggleSelect, group.id]);

  const handleClick = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      onCtrlSelect?.(group.id);
      return;
    }
    if (selectionMode) {
      onToggleSelect(group.id);
    }
  }, [selectionMode, onToggleSelect, onCtrlSelect, group.id]);

  const handleDoubleClick = useCallback(() => {
    triggerOpen();
  }, [triggerOpen]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    if (selectionMode) {
      onToggleSelect(group.id);
      return;
    }
    setMenuOpen(true);
  }, [selectionMode, onToggleSelect, group.id]);

  const longPressHandlers = useLongPress(triggerOpen, handlePrimaryTap);

  const handleArchiveToggle = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    const willArchive = !group.is_archived;
    toggleArchive(group.id, willArchive);
    showToast(willArchive ? 'archive' : 'restore', group.title);
  };

  const handleUngroup = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    ungroup(group.id);
    showToast('ungroup', group.title);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    trashGroup(group.id);
    showToast('delete', group.title);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
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

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`Group: ${group.title}, ${members.length} notes`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.onMouseLeave(); setMenuOpen(false); }}
      onKeyDown={(e) => e.key === 'Enter' && triggerOpen()}
      {...longPressHandlers}
      className={`touch-fast group-stack group relative cursor-pointer outline-none ${selected ? 'selected' : ''} ${menuOpen ? 'z-20' : ''}`}
    >
      <div className="group-stack-layer group-stack-back-2 bg-stone-100 border border-stone-200" />
      <div className="group-stack-layer group-stack-back-1 bg-white border border-stone-200" />

      <div
        style={tilt.style}
        className={`tilt-card relative z-10 rounded-2xl p-4 min-h-[10rem] will-change-transform ${colorForNote(group.id)} ${selected ? 'ring-2 ring-teal-600' : ''}`}
      >
        <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-2 pr-6">{group.title}</p>
        <p className="text-stone-500 text-xs">{members.length} note{members.length === 1 ? '' : 's'}</p>
      </div>

      {selectionMode && (
        <div
          aria-hidden="true"
          className={`absolute top-3 right-3 z-20 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
            selected ? 'bg-teal-600 border-teal-600' : 'bg-white/80 border-stone-300'
          }`}
        >
          {selected && <Icon name="check" size={12} className="text-white" />}
        </div>
      )}

      {!selectionMode && (
        <div
          ref={menuRef}
          className={`card-controls absolute top-2 right-2 z-20 ${menuOpen ? 'is-open' : ''}`}
        >
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Group options"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-600"
          >
            <Icon name="more" size={15} />
          </button>

          {menuOpen && menuStyle && (
            <div style={menuStyle} className="w-36 rounded-xl bg-white shadow-lg border border-stone-200 py-1 text-sm z-50">
              <MenuItem icon="edit" label="Open" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); triggerOpen(); }} />
              <MenuItem icon="share" label="Share" onClick={handleShare} />
              <MenuItem
                icon={group.is_archived ? 'restore' : 'archive'}
                label={group.is_archived ? 'Unarchive' : 'Archive'}
                onClick={handleArchiveToggle}
              />
              <MenuItem icon="undo" label="Ungroup" onClick={handleUngroup} />
              <MenuItem icon="trash" label="Delete" tone="danger" onClick={handleDelete} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

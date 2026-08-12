import { useRef, useState } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import { colorForNote } from './noteColors';
import { useToastStore } from '../../store/toastStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTilt } from '../../hooks/useTilt';
import { shareUrl, revokeShare } from '../../api/share.api';
import { copyableText } from '../../utils/noteHelpers';

// share.notes is always an array now (1-to-many) — group_title is set
// only when this share came from sharing a whole group.
export default function SharedNoteCard({ share, onRevoked }) {
  const menuRef = useRef(null);
  const tilt = useTilt();
  const [menuOpen, setMenuOpen] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const isBundle = share.notes.length > 1;
  const label = share.group_title || (isBundle ? `${share.notes.length} notes` : share.notes[0]?.title || 'Untitled note');

  const handleCopyContent = async () => {
    const text = share.notes.map(copyableText).join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op — toast still fires so there's at least visible feedback
    }
    showToast('copy', label);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await navigator.clipboard.writeText(shareUrl(share.share_token));
    showToast('share', label);
  };

  const handleRevoke = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await revokeShare(share.id);
      showToast('unshare', label);
      onRevoked(share.id);
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  };

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Shared: ${label}. Click to copy.`}
      onClick={handleCopyContent}
      onKeyDown={(e) => e.key === 'Enter' && handleCopyContent()}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.onMouseLeave(); setMenuOpen(false); }}
      className={`relative cursor-pointer outline-none ${menuOpen ? 'z-20' : ''}`}
    >
      <div
        style={tilt.style}
        className={`tilt-card rounded-2xl p-4 min-h-[9rem] will-change-transform ${colorForNote(share.id)}`}
      >
        <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-2 pr-6">{label}</p>
        {!isBundle && !share.group_title && (
          <p className="text-stone-700 text-sm leading-relaxed line-clamp-4 pr-6">{share.notes[0]?.description}</p>
        )}
        {(isBundle || share.group_title) && (
          <p className="text-stone-500 text-xs pr-6">{share.notes.length} note{share.notes.length === 1 ? '' : 's'}</p>
        )}
        <p className="text-xs text-stone-500 mt-2">
          Shared {new Date(share.shared_at).toLocaleDateString()}
        </p>
      </div>

      <div ref={menuRef} className="absolute top-2 right-2">
        <button
          type="button"
          aria-label="Shared item options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          className="p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-600"
        >
          <Icon name="more" size={15} />
        </button>

        {menuOpen && (
          <div className="absolute top-9 right-0 w-40 rounded-xl bg-white shadow-lg border border-stone-200 py-1 text-sm z-10">
            <MenuItem icon="share" label="Copy link" onClick={handleCopyLink} />
            <MenuItem icon="trash" label="Stop sharing" tone="danger" onClick={handleRevoke} />
          </div>
        )}
      </div>
    </div>
  );
}

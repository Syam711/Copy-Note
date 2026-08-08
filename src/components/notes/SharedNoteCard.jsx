import { useRef, useState } from 'react';
import Icon from '../icons/Icon';
import MenuItem from '../shared/MenuItem';
import { colorForNote } from './noteColors';
import { displayTitle, copyableText } from '../../utils/noteHelpers';
import { useToastStore } from '../../store/toastStore';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useTilt } from '../../hooks/useTilt';
import { shareUrl, revokeShare } from '../../api/share.api';

// Unlike NoteCard, this menu button is always visible rather than
// hidden until hover — there's no long-press-to-open alternative here
// (a share is a frozen snapshot, there's nothing to "open"), so it
// needs to be reliably tappable on mobile without a hover state.
export default function SharedNoteCard({ share, onRevoked }) {
  const menuRef = useRef(null);
  const tilt = useTilt();
  const [menuOpen, setMenuOpen] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const title = displayTitle(share);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(copyableText(share));
    } catch {
      // no-op — toast still fires so there's at least visible feedback
    }
    showToast('copy', title);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    await navigator.clipboard.writeText(shareUrl(share.share_token));
    showToast('share', title);
  };

  const handleRevoke = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await revokeShare(share.id);
      showToast('unshare', title);
      onRevoked(share.id);
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Shared note: ${title}. Click to copy.`}
      onClick={handleCopyContent}
      onKeyDown={(e) => e.key === 'Enter' && handleCopyContent()}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={() => { tilt.onMouseLeave(); setMenuOpen(false); }}
      className={`relative cursor-pointer outline-none ${menuOpen ? 'z-20' : ''}`}
    >
      {/* See NoteCard.jsx for why the transform lives on this inner
          box rather than the outer element — it keeps the menu below
          from being trapped inside a stacking context that sibling
          cards could paint over. */}
      <div
        style={tilt.style}
        className={`rounded-2xl p-4 min-h-[9rem] will-change-transform ${colorForNote(share.id)}`}
      >
        {share.title?.trim() && (
          <p className="font-medium text-stone-800 text-sm mb-1 line-clamp-1 pr-6">{share.title}</p>
        )}
        <p className={`text-stone-700 text-sm leading-relaxed line-clamp-4 pr-6 ${share.title?.trim() ? '' : 'font-medium'}`}>
          {share.description}
        </p>
        <p className="text-xs text-stone-500 mt-2">
          Shared {new Date(share.shared_at).toLocaleDateString()}
        </p>
      </div>

      <div ref={menuRef} className="absolute top-2 right-2">
        <button
          type="button"
          aria-label="Shared note options"
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

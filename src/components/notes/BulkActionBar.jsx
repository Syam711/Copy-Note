import Icon from '../icons/Icon';

// Every action button only renders when its handler is provided —
// that's how the composition rules (mixed selection disables Delete,
// 2+ groups disables Share, etc.) surface here. This component stays
// dumb on purpose; the page computes which handlers to pass.
export default function BulkActionBar({
  count,
  onArchive,
  archiveLabel = 'Archive',
  onGroup,
  onShare,
  onDelete,
  deleteLabel = 'Delete',
  onCancel,
}) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-stone-800 text-stone-50 rounded-full pl-4 pr-2 py-2 shadow-lg">
      <span className="text-sm mr-2">{count} selected</span>
      {onArchive && (
        <button type="button" onClick={onArchive} aria-label={archiveLabel} className="p-2 rounded-full hover:bg-stone-700">
          <Icon name={archiveLabel === 'Unarchive' ? 'restore' : 'archive'} size={16} />
        </button>
      )}
      {onGroup && (
        <button type="button" onClick={onGroup} aria-label="Group" className="p-2 rounded-full hover:bg-stone-700">
          <Icon name="group" size={16} />
        </button>
      )}
      {onShare && (
        <button type="button" onClick={onShare} aria-label="Share" className="p-2 rounded-full hover:bg-stone-700">
          <Icon name="share" size={16} />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={deleteLabel} className="p-2 rounded-full hover:bg-rose-600">
          <Icon name={deleteLabel === 'Ungroup' ? 'undo' : 'trash'} size={16} />
        </button>
      )}
      <button type="button" onClick={onCancel} aria-label="Cancel selection" className="p-2 rounded-full hover:bg-stone-700">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

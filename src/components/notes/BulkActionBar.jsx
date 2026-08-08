import Icon from '../icons/Icon';

// archiveLabel lets Archive.jsx reuse this as "Unarchive" instead of
// building a near-duplicate component for one label difference.
export default function BulkActionBar({ count, onArchive, archiveLabel = 'Archive', onShare, onDelete, onCancel }) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-stone-800 text-stone-50 rounded-full pl-4 pr-2 py-2 shadow-lg">
      <span className="text-sm mr-2">{count} selected</span>
      <button type="button" onClick={onArchive} aria-label={archiveLabel} className="p-2 rounded-full hover:bg-stone-700">
        <Icon name={archiveLabel === 'Unarchive' ? 'restore' : 'archive'} size={16} />
      </button>
      <button type="button" onClick={onShare} aria-label="Share" className="p-2 rounded-full hover:bg-stone-700">
        <Icon name="share" size={16} />
      </button>
      <button type="button" onClick={onDelete} aria-label="Delete" className="p-2 rounded-full hover:bg-rose-600">
        <Icon name="trash" size={16} />
      </button>
      <button type="button" onClick={onCancel} aria-label="Cancel selection" className="p-2 rounded-full hover:bg-stone-700">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

import Icon from '../icons/Icon';

export default function MenuItem({ icon, label, onClick, tone = 'default' }) {
  const toneClass = tone === 'danger' ? 'text-rose-600 hover:bg-rose-50' : 'text-stone-700 hover:bg-stone-50';
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${toneClass}`}>
      <Icon name={icon} size={14} />
      {label}
    </button>
  );
}

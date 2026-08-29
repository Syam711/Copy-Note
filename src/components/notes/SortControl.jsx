import { useState, useRef } from 'react';
import Icon from '../icons/Icon';
import { useClickOutside } from '../../hooks/useClickOutside';

const OPTIONS = [
  { key: 'modified', label: 'Last modified' },
  { key: 'created', label: 'Date created' },
  { key: 'name', label: 'Name' },
];

export default function SortControl({ sortBy, sortDir, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  // Clicking the option that's already active flips its direction —
  // clicking a different one switches to it at a sensible default
  // (newest-first for dates, A-first for name).
  const handlePick = (key) => {
    if (key === sortBy) {
      onChange(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onChange(key, key === 'name' ? 'asc' : 'desc');
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label="Sort"
        onClick={() => setOpen((o) => !o)}
        className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-100"
      >
        <Icon name="sort" size={16} />
      </button>
      {open && (
        <div className="absolute top-11 right-0 w-44 rounded-xl bg-white shadow-lg border border-stone-200 py-1 text-sm z-20">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handlePick(opt.key)}
              className="flex items-center justify-between w-full px-3 py-2 hover:bg-stone-50 text-stone-700"
            >
              {opt.label}
              {sortBy === opt.key && (
                <Icon name={sortDir === 'asc' ? 'arrowUp' : 'arrowDown'} size={14} className="text-teal-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

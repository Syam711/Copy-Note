import { useState } from 'react';
import Icon from '../icons/Icon';

export default function TitleFilter({ query, onQueryChange }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Filter by title"
        onClick={() => setOpen(true)}
        className="p-2.5 rounded-full border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 shrink-0"
      >
        <Icon name="search" size={16} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-2xl px-3 py-2 shrink-0">
      <Icon name="search" size={15} className="text-stone-400 shrink-0" />
      <input
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Filter by title…"
        className="outline-none text-sm bg-transparent w-32 sm:w-44"
      />
      <button
        type="button"
        aria-label="Clear filter"
        onClick={() => { onQueryChange(''); setOpen(false); }}
        className="text-stone-400 hover:text-stone-600 shrink-0"
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

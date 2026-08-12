import { create } from 'zustand';

// One config object maps every action to its message + icon name (a
// string, resolved to a component in components/icons/icon-map.js —
// this file deliberately doesn't import an icon library itself, to
// stay decoupled from that choice).
export const TOAST_CONFIG = {
  copy: { icon: 'copy', message: (title) => `Copied "${title}"` },
  delete: { icon: 'trash', message: (title) => `Deleted "${title}"` },
  archive: { icon: 'archive', message: (title) => `Archived "${title}"` },
  restore: { icon: 'restore', message: (title) => `Restored "${title}"` },
  share: { icon: 'share', message: (title) => `Share link copied for "${title}"` },
  shareRequiresAccount: { icon: 'lock', message: () => 'Sign in to share notes' },
  unshare: { icon: 'trash', message: (title) => `Stopped sharing "${title}"` },
  bulkShare: { icon: 'share', message: (n) => `Created ${n} share link${n === 1 ? '' : 's'}` },
  ungroup: { icon: 'trash', message: (title) => `Ungrouped "${title}"` },
  import: { icon: 'import', message: (label) => `Imported ${label}` },
};

export const useToastStore = create((set) => ({
  toasts: [],

  // The one function every action funnels through: showToast('delete', note.title)
  showToast: (action, title) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, action, title }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2400);
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

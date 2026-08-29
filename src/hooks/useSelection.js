import { useState, useCallback } from 'react';

export function useSelection() {
  const [active, setActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const enter = useCallback(() => setActive(true), []);

  const exit = useCallback(() => {
    setActive(false);
    setSelectedIds(new Set());
  }, []);

  // Distinct from exit() — clears the selection but stays in
  // selection mode, for a "Deselect all" action.
  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selectAll = useCallback((ids) => {
    setActive(true);
    setSelectedIds(new Set(ids));
  }, []);

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { active, selectedIds, enter, exit, clear, selectAll, toggle, count: selectedIds.size };
}

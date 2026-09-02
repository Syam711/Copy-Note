import { useRef, useState, useLayoutEffect, useEffect } from 'react';

// Returns { buttonRef, style }. Attach buttonRef to the trigger
// button; when `open` becomes true, style holds fixed-position
// coordinates anchored to that button's actual on-screen position —
// apply it to the dropdown instead of `absolute top-9 right-0`.
//
// Why this exists: dropdowns were positioned with plain
// `position: absolute`, anchored to a wrapper inside each card. That
// works fine in a normal grid, but the notes grid uses CSS
// multi-column layout (see NoteGrid.jsx) for the Keep-style masonry
// look, and multi-column formatting contexts can clip or fragment
// absolutely-positioned content that overflows its column at the
// column boundary — which is what showed up as menu items appearing
// split, or bleeding into a neighboring card. `position: fixed`
// escapes that entirely, since multicol doesn't reparent the
// containing block for fixed-position elements the way it can affect
// absolute ones (transform would, but nothing here is transformed).
export function useFixedMenuPosition(open, onClose) {
  const buttonRef = useRef(null);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    } else {
      setStyle(null);
    }
  }, [open]);

  // A fixed-position menu doesn't move when the page scrolls under
  // it, which would look broken (menu detached from its button) — so
  // just close it on scroll instead, same as most apps do with open
  // dropdowns. Calls onClose (the parent's setMenuOpen(false)) rather
  // than only clearing local style, since the parent's own open flag
  // is still what decides whether the dropdown renders at all.
  useEffect(() => {
    if (!open) return undefined;
    const handleScroll = () => onClose?.();
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [open, onClose]);

  return { buttonRef, style };
}

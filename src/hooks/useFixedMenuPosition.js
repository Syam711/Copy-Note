import { useRef, useState, useLayoutEffect, useEffect } from 'react';

const MARGIN = 8; // never let the menu touch the viewport edge
const ESTIMATED_MENU_HEIGHT = 220; // generous upper bound for any dropdown in this app
const ESTIMATED_MENU_WIDTH = 180; // generous upper bound for any dropdown in this app (current menus are 144-176px)

// Returns { buttonRef, style }. Attach buttonRef to the trigger
// button; when `open` becomes true, style holds fixed-position
// coordinates anchored to that button's actual on-screen position —
// apply it to the dropdown instead of `absolute top-9 right-0`.
//
// Why fixed positioning at all: dropdowns used to be plain
// `position: absolute`, anchored to a wrapper inside each card. That
// works fine in a normal grid, but the notes grid uses CSS
// multi-column layout (see NoteGrid.jsx) for the Keep-style masonry
// look, and multi-column formatting contexts can clip or fragment
// absolutely-positioned content that overflows its column at the
// column boundary — which is what showed up as menu items appearing
// split, or bleeding into a neighboring card. `position: fixed`
// escapes that, since multicol doesn't reparent the containing block
// for fixed-position elements the way it can affect absolute ones.
//
// That fix alone wasn't enough, though: a fixed position still needs
// to account for WHERE on screen the button actually is. A button
// near the bottom of the viewport would have its menu computed to
// open downward regardless, pushing it partly or fully off-screen.
// This picks a direction based on available space, and backs that up
// with `maxHeight` + `overflowY: auto` — even if the space estimate
// is imprecise, the menu is mathematically capped to whatever room
// actually exists in the direction it opens, so it can never render
// off-screen; worst case it scrolls internally instead.
export function useFixedMenuPosition(open, onClose) {
  const buttonRef = useRef(null);
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setStyle(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < ESTIMATED_MENU_HEIGHT && spaceAbove > spaceBelow;

    const spaceRight = window.innerWidth - rect.right;
    const rightAnchorFits = rect.right >= ESTIMATED_MENU_WIDTH + MARGIN;
    const leftAnchorFits = window.innerWidth - rect.left >= ESTIMATED_MENU_WIDTH + MARGIN;
    const useLeftAnchor = !rightAnchorFits && leftAnchorFits;

    setStyle({
      position: 'fixed',
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.max(120, spaceAbove - MARGIN * 2) }
        : { top: rect.bottom + 4, maxHeight: Math.max(120, spaceBelow - MARGIN * 2) }),
      ...(useLeftAnchor
        ? { left: Math.max(MARGIN, rect.left) }
        : { right: Math.max(MARGIN, spaceRight) }),
      maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
      overflowY: 'auto',
    });
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

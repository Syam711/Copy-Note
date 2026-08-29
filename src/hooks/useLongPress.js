import { useRef, useCallback } from 'react';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10; // a scroll shouldn't register as a long-press

// Returns the touch handlers to spread onto a note card. Fires
// onLongPress if the finger stays down (and roughly still) past the
// threshold; otherwise, on a clean quick release, fires onTap — which
// is the "single tap copies" behavior. Deliberately never calls
// preventDefault anywhere here, so native scrolling over a card is
// never blocked.
export function useLongPress(onLongPress, onTap) {
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const firedLongPress = useRef(false);
  const hasMoved = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    firedLongPress.current = false;
    hasMoved.current = false;
    timerRef.current = setTimeout(() => {
      firedLongPress.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      // This was the missing piece: clear() only stopped the
      // long-press timer from firing. Nothing recorded that movement
      // happened at all, so onTouchEnd had no way to distinguish a
      // scroll from a clean tap — it only checked "did long-press
      // fire," and a scroll makes that false exactly the same way a
      // real tap does. hasMoved is the distinct signal onTouchEnd
      // actually needs.
      hasMoved.current = true;
      clear();
    }
  }, [clear]);

  const onTouchEnd = useCallback(() => {
    const wasLongPress = firedLongPress.current;
    const wasScroll = hasMoved.current;
    clear();
    if (!wasLongPress && !wasScroll) onTap();
  }, [clear, onTap]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: clear };
}

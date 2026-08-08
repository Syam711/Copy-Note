import { useRef, useCallback } from 'react';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10; // a scroll shouldn't register as a long-press

// Returns the touch handlers to spread onto a note card. Fires
// onLongPress if the finger stays down (and roughly still) past the
// threshold; otherwise, on a clean quick release, fires onTap — which
// is the "single tap copies" behavior.
export function useLongPress(onLongPress, onTap) {
  const timerRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const firedLongPress = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    firedLongPress.current = false;
    timerRef.current = setTimeout(() => {
      firedLongPress.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clear();
  }, [clear]);

  const onTouchEnd = useCallback(() => {
    const wasLongPress = firedLongPress.current;
    clear();
    if (!wasLongPress) onTap();
  }, [clear, onTap]);

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: clear };
}

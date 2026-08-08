import { useEffect } from 'react';

export function useClickOutside(ref, onOutsideClick, active = true) {
  useEffect(() => {
    if (!active) return;
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutsideClick();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [ref, onOutsideClick, active]);
}

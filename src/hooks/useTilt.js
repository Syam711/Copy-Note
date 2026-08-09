import { useState, useCallback } from 'react';

const MAX_TILT_DEG = 10;

// Returns { style, onMouseMove, onMouseLeave }. `style` is just CSS
// custom properties now — the actual transform/shadow/transition
// declarations live in styles/tilt.css, this only supplies the
// per-frame numbers. Pair with className="tilt-card" on the element.
export function useTilt() {
  const [style, setStyle] = useState({});

  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const offsetY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setStyle({
      '--tilt-rx': `${-offsetY * MAX_TILT_DEG}deg`,
      '--tilt-ry': `${offsetX * MAX_TILT_DEG}deg`,
      '--tilt-scale': 1.035,
      '--tilt-shadow': `${-offsetX * 14}px ${-offsetY * 14 + 12}px 24px -10px rgb(41 37 36 / 0.35)`,
      '--tilt-transition': 'transform 60ms linear',
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    setStyle({
      '--tilt-rx': '0deg',
      '--tilt-ry': '0deg',
      '--tilt-scale': 1,
      '--tilt-shadow': '0 1px 3px rgb(41 37 36 / 0.12)',
      '--tilt-transition': 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
    });
  }, []);

  return { style, onMouseMove, onMouseLeave };
}

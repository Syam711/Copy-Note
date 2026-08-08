import { useState, useCallback } from 'react';

const MAX_TILT_DEG = 10;

// Returns a style object plus the two handlers to spread onto any
// card-shaped element. No transition during movement (that's what
// sells the "weight" feel — instant response); the spring-back on
// release gets a short eased transition instead.
export function useTilt() {
  const [style, setStyle] = useState({});

  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const offsetY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setStyle({
      transform: `perspective(700px) scale3d(1.035,1.035,1.035) rotateX(${-offsetY * MAX_TILT_DEG}deg) rotateY(${offsetX * MAX_TILT_DEG}deg)`,
      transition: 'transform 60ms linear',
      boxShadow: `${-offsetX * 14}px ${-offsetY * 14 + 12}px 24px -10px rgb(41 37 36 / 0.35)`,
    });
  }, []);

  const onMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(700px) scale3d(1,1,1) rotateX(0deg) rotateY(0deg)',
      transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
      boxShadow: '0 1px 3px rgb(41 37 36 / 0.12)',
    });
  }, []);

  return { style, onMouseMove, onMouseLeave };
}

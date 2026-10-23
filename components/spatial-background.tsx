'use client';
import { useEffect } from 'react';

/** Ambient light orbs that shift subtly with the pointer. Does nothing under reduced motion or on touch. */
export function SpatialBackground() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(hover: hover)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const s = document.documentElement.style;
        s.setProperty('--px', String((e.clientX / window.innerWidth - 0.5) * 2));
        s.setProperty('--py', String((e.clientY / window.innerHeight - 0.5) * 2));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="orbs" aria-hidden>
      <div className="orb orb-a" />
      <div className="orb orb-b" />
    </div>
  );
}

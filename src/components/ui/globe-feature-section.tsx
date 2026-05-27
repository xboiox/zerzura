'use client';

import type { COBEOptions } from 'cobe';
import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16_000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [179 / 255, 29 / 255, 29 / 255],
  glowColor: [1, 1, 1],
  devicePixelRatio: 2,
  markers: [
    { location: [-6.2088, 106.8456], size: 0.12 }, // Jakarta
    { location: [-7.2575, 112.7521], size: 0.07 }, // Surabaya
    { location: [-6.9175, 107.6191], size: 0.06 }, // Bandung
    { location: [1.3521, 103.8198], size: 0.08 }, // Singapore
    { location: [3.139, 101.6869], size: 0.07 }, // Kuala Lumpur
    { location: [13.7563, 100.5018], size: 0.06 }, // Bangkok
    { location: [22.3193, 114.1694], size: 0.06 }, // Hong Kong
    { location: [35.6762, 139.6503], size: 0.08 }, // Tokyo
    { location: [37.5665, 126.978], size: 0.06 }, // Seoul
    { location: [39.9042, 116.4074], size: 0.07 }, // Beijing
  ],
};

type GlobeProps = {
  className?: string;
  config?: COBEOptions;
};

export function Globe(props: GlobeProps) {
  const config = props.config ?? GLOBE_CONFIG;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerDelta = useRef(0);
  const phi = useRef(0);
  const width = useRef(0);
  const rafId = useRef(0);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value === null ? 'grab' : 'grabbing';
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      pointerDelta.current = clientX - pointerInteracting.current;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return () => {
        /* no canvas, nothing to clean up */
      };
    }

    const onResize = () => {
      width.current = canvas.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvas, {
      ...config,
      width: width.current * 2,
      height: width.current * 2,
    });

    setTimeout(() => {
      canvas.style.opacity = '1';
    });

    const onFrame = () => {
      if (!pointerInteracting.current) {
        phi.current += 0.005;
      }
      globe.update({
        phi: phi.current + pointerDelta.current / 200,
        width: width.current * 2,
        height: width.current * 2,
      });
      rafId.current = requestAnimationFrame(onFrame);
    };

    rafId.current = requestAnimationFrame(onFrame);

    return () => {
      globe.destroy();
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', onResize);
    };
    // config is stable (constant or stable prop) — intentional omission
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cn('absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]', props.className)}
    >
      <canvas
        aria-label="Interactive globe"
        className="size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        ref={canvasRef}
        onPointerDown={(e) => {
          updatePointerInteraction(e.clientX - pointerDelta.current);
        }}
        onPointerUp={() => {
          updatePointerInteraction(null);
        }}
        onPointerOut={() => {
          updatePointerInteraction(null);
        }}
        onMouseMove={(e) => {
          updateMovement(e.clientX);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) {
            updateMovement(e.touches[0].clientX);
          }
        }}
      />
    </div>
  );
}

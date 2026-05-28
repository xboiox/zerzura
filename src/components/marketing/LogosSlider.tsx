'use client';

import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';

type LogoItem = {
  id: string;
  logoUrl: string;
  altText: string | null;
};

type LogosSliderProps = {
  logos: LogoItem[];
};

export function LogosSlider(props: LogosSliderProps) {
  return (
    <div className="relative h-44 w-full overflow-hidden">
      <InfiniteSlider className="flex h-full w-full items-center" duration={30} gap={48}>
        {props.logos.map((logo) => (
          <div key={logo.id} className="flex w-56 items-center justify-center">
            {/* biome-ignore lint/performance/noImgElement: no next/image needed for external logos in marquee */}
            <img
              src={logo.logoUrl}
              alt={logo.altText ?? ''}
              className="h-40 w-auto max-w-[224px] object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </InfiniteSlider>
      <ProgressiveBlur
        className="pointer-events-none absolute top-0 left-0 h-full w-32 sm:w-[200px]"
        direction="left"
        blurIntensity={1}
      />
      <ProgressiveBlur
        className="pointer-events-none absolute top-0 right-0 h-full w-32 sm:w-[200px]"
        direction="right"
        blurIntensity={1}
      />
    </div>
  );
}

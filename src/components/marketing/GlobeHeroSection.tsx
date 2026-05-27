'use client';

import { ArrowRight, PhoneCallIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Globe } from '@/components/ui/globe-feature-section';
import { cn } from '@/lib/utils';
import { Link } from '@/libs/I18nNavigation';

type GlobeHeroSectionProps = {
  companyName: string;
  tagline: string;
  ctaJobsLabel: string;
  ctaContactLabel: string;
};

export function GlobeHeroSection(props: GlobeHeroSectionProps) {
  return (
    <section className="relative mx-4 mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-6 py-14 shadow-sm sm:mx-6 md:px-14 md:py-20">
      <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
        <div className="z-10 max-w-xl text-left">
          <h1 className="text-4xl leading-tight font-medium text-gray-900 md:text-5xl">
            {props.companyName}
          </h1>
          <p className="mt-4 text-base text-gray-500 sm:text-lg">{props.tagline}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/about" className={buttonVariants({ variant: 'outline' })}>
              <PhoneCallIcon className="mr-2 size-4" />
              {props.ctaContactLabel}
            </Link>
            <Link href="/jobs" className={cn(buttonVariants(), 'rounded-full')}>
              {props.ctaJobsLabel}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>

        <div className="relative h-56 w-full max-w-sm md:h-80 md:max-w-md">
          <Globe className="absolute -right-16 -bottom-16 scale-110 md:-right-24 md:-bottom-24 md:scale-125" />
        </div>
      </div>
    </section>
  );
}

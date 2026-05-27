type LogoItem = {
  id: string;
  logoUrl: string;
  altText: string | null;
};

type LogoMarqueeProps = {
  logos: LogoItem[];
};

export function LogoMarquee(props: LogoMarqueeProps) {
  if (props.logos.length === 0) {
    return null;
  }

  const doubled = [...props.logos, ...props.logos];
  const duration = `${Math.max(15, props.logos.length * 3)}s`;

  return (
    <div
      className="group w-full overflow-hidden"
      style={{
        maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div
        className={`flex w-max animate-[marquee_${duration}_linear_infinite] gap-4 group-hover:[animation-play-state:paused]`}
      >
        {doubled.map((logo, i) => (
          <img
            key={`${logo.id}-${i}`}
            src={logo.logoUrl}
            alt={logo.altText ?? ''}
            className="h-40 w-auto max-w-[480px] flex-shrink-0 object-contain"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

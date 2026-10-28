import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Intrinsic size of /logo.png and /logo-white.png. Passing it lets the browser reserve space
// (no layout shift) and lets next/image serve a small, modern-format copy instead of the 100 KB PNG.
const LOGO_WIDTH = 997;
const LOGO_HEIGHT = 259;

export interface PolarisLogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'icon';
  theme?: 'auto' | 'light' | 'dark';
  alt?: string;
  /** Load eagerly; use for logos visible on first paint. */
  priority?: boolean;
}

export function PolarisLogo({
  className,
  size,
  variant = 'full',
  theme = 'auto',
  alt = 'Polaris Tax Services',
  priority = false,
}: PolarisLogoProps) {
  // 1. Icon-only variant (square emblem derived from logo)
  if (variant === 'icon') {
    return (
      <Image
        src="/icon-512.png"
        alt={alt}
        width={size || 36}
        height={size || 36}
        priority={priority}
        className={cn('inline-block shrink-0 object-contain', className)}
      />
    );
  }

  const logo = (src: string, extra?: string) => (
    <Image
      src={src}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      sizes="180px"
      priority={priority}
      className={cn('inline-block h-9 w-auto shrink-0 object-contain', extra, className)}
    />
  );

  // 2. Explicit dark theme (white text + gold apex on dark backgrounds)
  if (theme === 'dark') return logo('/logo-white.png');

  // 3. Explicit light theme (navy text + gold apex on light backgrounds)
  if (theme === 'light') return logo('/logo.png');

  // 4. Auto theme (adapts dynamically to dark/light mode)
  return (
    <>
      {logo('/logo.png', 'dark:hidden')}
      {logo('/logo-white.png', 'hidden dark:inline-block')}
    </>
  );
}

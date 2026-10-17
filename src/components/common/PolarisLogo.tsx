import React from 'react';
import { cn } from '@/lib/utils';

export interface PolarisLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
  variant?: 'full' | 'icon';
  theme?: 'auto' | 'light' | 'dark';
  alt?: string;
}

export function PolarisLogo({
  className,
  size,
  variant = 'full',
  theme = 'auto',
  alt = 'Polaris Tax Services',
  ...props
}: PolarisLogoProps) {
  // 1. Icon-only variant (square emblem derived from logo)
  if (variant === 'icon') {
    return (
      <img
        src="/icon-512.png"
        alt={alt}
        width={size || 36}
        height={size || 36}
        className={cn('inline-block shrink-0 object-contain', className)}
        {...props}
      />
    );
  }

  // 2. Explicit dark theme (white text + gold apex on dark backgrounds)
  if (theme === 'dark') {
    return (
      <img
        src="/logo-white.png"
        alt={alt}
        className={cn('inline-block shrink-0 object-contain h-9 w-auto', className)}
        {...props}
      />
    );
  }

  // 3. Explicit light theme (navy text + gold apex on light backgrounds)
  if (theme === 'light') {
    return (
      <img
        src="/logo.png"
        alt={alt}
        className={cn('inline-block shrink-0 object-contain h-9 w-auto', className)}
        {...props}
      />
    );
  }

  // 4. Auto theme (adapts dynamically to dark/light mode)
  return (
    <>
      <img
        src="/logo.png"
        alt={alt}
        className={cn('inline-block shrink-0 object-contain h-9 w-auto dark:hidden', className)}
        {...props}
      />
      <img
        src="/logo-white.png"
        alt={alt}
        className={cn('hidden shrink-0 object-contain h-9 w-auto dark:inline-block', className)}
        {...props}
      />
    </>
  );
}

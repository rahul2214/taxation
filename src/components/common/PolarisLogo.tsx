import React from 'react';
import { cn } from '@/lib/utils';

interface PolarisLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function PolarisLogo({ className, size = 32, ...props }: PolarisLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn('inline-block shrink-0', className)}
      {...props}
    >
      <defs>
        <linearGradient id="crestShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#141B34" />
          <stop offset="45%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#070B16" />
        </linearGradient>

        <linearGradient id="crestBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        <linearGradient id="polarisFacetLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <linearGradient id="polarisFacetMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <linearGradient id="polarisFacetDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id="polarisGrowthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="polarisGrowthDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <filter id="polarisBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Security Crest / Shield of Tax Defense */}
      <path
        d="M 256 36 C 278 48, 350 72, 420 86 C 428 206, 386 338, 256 468 C 126 338, 84 206, 92 86 C 162 72, 234 48, 256 36 Z"
        fill="url(#crestShieldGrad)"
        stroke="url(#crestBorderGrad)"
        strokeWidth="12"
        strokeLinejoin="round"
      />

      {/* Inner Shield Contour */}
      <path
        d="M 256 64 C 274 74, 336 94, 396 106 C 404 204, 368 314, 256 428 C 144 314, 108 204, 116 106 C 176 94, 238 74, 256 64 Z"
        fill="none"
        stroke="url(#crestBorderGrad)"
        strokeWidth="3"
        strokeOpacity="0.35"
      />

      {/* Ambient Starlight Glow */}
      <circle cx="256" cy="220" r="110" fill="#0EA5E9" opacity="0.14" filter="url(#polarisBloom)" />

      {/* Secondary Diagonal Compass Rays (NE, SE, SW, NW) */}
      <polygon points="256,220 316,160 270,206" fill="url(#polarisGrowthGrad)" />
      <polygon points="256,220 316,160 270,234" fill="url(#polarisGrowthDark)" />
      <polygon points="256,220 316,280 270,234" fill="url(#polarisGrowthDark)" />
      <polygon points="256,220 316,280 242,248" fill="url(#polarisGrowthGrad)" />
      <polygon points="256,220 196,280 242,248" fill="url(#polarisGrowthGrad)" />
      <polygon points="256,220 196,280 242,206" fill="url(#polarisGrowthDark)" />
      <polygon points="256,220 196,160 242,206" fill="url(#polarisGrowthDark)" />
      <polygon points="256,220 196,160 270,206" fill="url(#polarisGrowthGrad)" />

      {/* Primary Polaris North Star (North, East, South, West) */}
      <polygon points="256,100 256,220 238,220" fill="url(#polarisFacetLight)" />
      <polygon points="256,100 274,220 256,220" fill="url(#polarisFacetMid)" />
      <polygon points="376,220 256,202 256,220" fill="url(#polarisFacetLight)" />
      <polygon points="376,220 256,220 256,238" fill="url(#polarisFacetDark)" />
      <polygon points="256,340 274,220 256,220" fill="url(#polarisFacetMid)" />
      <polygon points="256,340 256,220 238,220" fill="url(#polarisFacetDark)" />
      <polygon points="136,220 256,220 256,202" fill="url(#polarisFacetLight)" />
      <polygon points="136,220 256,238 256,220" fill="url(#polarisFacetMid)" />

      {/* Radiant Diamond Star Center */}
      <polygon points="256,204 272,220 256,236 240,220" fill="#FFFFFF" filter="url(#polarisBloom)" />
      <circle cx="256" cy="220" r="5" fill="#38BDF8" />

      {/* Ascending Tax Return Growth Vector Arc */}
      <path
        d="M 175 365 C 215 395, 238 405, 256 405 C 285 405, 315 375, 345 315"
        fill="none"
        stroke="url(#polarisGrowthGrad)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 330 315 L 348 312 L 348 332"
        fill="none"
        stroke="url(#polarisGrowthGrad)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

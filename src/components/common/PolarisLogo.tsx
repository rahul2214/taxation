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
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id="logoShieldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        <linearGradient id="logoShieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="logoStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <linearGradient id="logoStarAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        <linearGradient id="logoCheckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="120" fill="url(#logoBgGrad)" />
      <rect width="504" height="504" x="4" y="4" rx="116" fill="none" stroke="url(#logoShieldBorder)" strokeWidth="6" strokeOpacity="0.3" />

      <path
        d="M 256 95 C 310 95, 370 110, 395 130 C 395 245, 345 345, 256 415 C 167 345, 117 245, 117 130 C 142 110, 202 95, 256 95 Z"
        fill="url(#logoShieldFill)"
        stroke="url(#logoShieldBorder)"
        strokeWidth="12"
        strokeLinejoin="round"
      />

      <path
        d="M 256 120 C 298 120, 346 132, 368 148 C 368 238, 328 320, 256 382 C 184 320, 144 238, 144 148 C 166 132, 214 120, 256 120 Z"
        fill="none"
        stroke="url(#logoShieldBorder)"
        strokeWidth="3"
        strokeOpacity="0.4"
      />

      <g transform="rotate(45, 256, 235)">
        <path
          d="M 256 175 Q 256 235, 196 235 Q 256 235, 256 295 Q 256 235, 316 235 Q 256 235, 256 175 Z"
          fill="url(#logoStarAccent)"
          opacity="0.85"
        />
      </g>

      <path
        d="M 256 135 Q 256 235, 156 235 Q 256 235, 256 335 Q 256 235, 356 235 Q 256 235, 256 135 Z"
        fill="url(#logoStarGrad)"
      />

      <circle cx="256" cy="235" r="18" fill="#FFFFFF" />
      <circle cx="256" cy="235" r="10" fill="#38BDF8" />
      <circle cx="256" cy="235" r="5" fill="#FFFFFF" />

      <path
        d="M 195 285 L 240 330 L 330 230"
        fill="none"
        stroke="url(#logoCheckGrad)"
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 195 285 L 240 330 L 330 230"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

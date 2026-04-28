import { cn } from '@/utils/cn'

type LogoProps = {
  className?: string
  /** Show text alongside the icon */
  showText?: boolean
}

/**
 * FlipEdu SVG Logo — works perfectly in both light and dark modes.
 * The icon is a stylised flipping book / graduation cap hybrid.
 */
export function FlipEduLogo({ className, showText = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flip-brand" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Background square - slightly transparent in light mode, solid in dark or vice versa */}
        <rect width="48" height="48" rx="12" className="fill-slate-100 dark:fill-slate-800" />
        
        {/* Brand accent - a small dot or strip to keep identity */}
        <circle cx="38" cy="10" r="4" fill="url(#flip-brand)" />

        {/* Main Icon (Book/Flip) - Theme aware color */}
        <g className="fill-slate-900 dark:fill-white transition-colors duration-300">
          {/* Left side of book */}
          <path
            d="M14 14 C14 13 15 12 16 12 L24 12 L24 36 L16 36 C15 36 14 35 14 34 Z"
            opacity="0.8"
          />
          {/* Right side (the flip) */}
          <path
            d="M24 12 L32 12 C33 12 34 13 34 14 L34 34 C34 35 33 36 32 36 L24 36 Z"
          />
          {/* Flip detail */}
          <path
            d="M34 14 C36 15 38 18 38 24 C38 30 36 33 34 34"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-slate-900 dark:stroke-white"
            opacity="0.5"
          />
        </g>

        {/* Graduation cap accent - Brand color */}
        <path
          d="M24 8 L18 11 L24 14 L30 11 Z"
          fill="url(#flip-brand)"
        />
        <line x1="24" y1="14" x2="24" y2="18" stroke="url(#flip-brand)" strokeWidth="1.5" />
      </svg>

      {showText && (
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          FlipEdu
        </span>
      )}
    </span>
  )
}

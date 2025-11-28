interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-xl',
  xl: 'text-3xl',
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1"/>
              <stop offset="100%" stopColor="#4f46e5"/>
            </linearGradient>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="100%" stopColor="#e0e7ff"/>
            </linearGradient>
          </defs>
          
          {/* Rounded square background */}
          <rect x="4" y="4" width="112" height="112" rx="24" fill="url(#bgGradient)"/>
          
          {/* Scoreboard shape */}
          <rect x="20" y="28" width="80" height="50" rx="8" fill="url(#scoreGradient)" opacity="0.95"/>
          
          {/* Score divider line */}
          <line x1="60" y1="32" x2="60" y2="74" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 3"/>
          
          {/* Left score */}
          <text x="40" y="62" fontFamily="system-ui" fontSize="28" fontWeight="700" fill="#4f46e5" textAnchor="middle">3</text>
          
          {/* Right score */}
          <text x="80" y="62" fontFamily="system-ui" fontSize="28" fontWeight="700" fill="#4f46e5" textAnchor="middle">2</text>
          
          {/* Bottom accent bar */}
          <rect x="30" y="86" width="60" height="6" rx="3" fill="#ffffff" opacity="0.9"/>
          
          {/* Decorative dots */}
          <circle cx="35" cy="89" r="2" fill="#6366f1"/>
          <circle cx="60" cy="89" r="2" fill="#6366f1"/>
          <circle cx="85" cy="89" r="2" fill="#6366f1"/>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <span className={`font-bold ${textSizes[size]} text-slate-800 dark:text-white tracking-tight`}>
          Board<span className="text-indigo-600 dark:text-indigo-400">Score</span>
        </span>
      )}
    </div>
  )
}

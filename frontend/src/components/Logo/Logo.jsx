export default function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <linearGradient id="pp-bg" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e40af"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" ry="22" fill="url(#pp-bg)"/>
        <rect x="14" y="70" width="50" height="7" rx="3.5" fill="white" opacity="0.45"/>
        <rect x="14" y="57" width="39" height="7" rx="3.5" fill="white" opacity="0.68"/>
        <rect x="14" y="44" width="29" height="7" rx="3.5" fill="white" opacity="0.88"/>
        <line x1="62" y1="72" x2="82" y2="52" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.95"/>
        <polygon points="82,52 73.5,52.5 81.5,60.5" fill="white" opacity="0.95"/>
        <line x1="66" y1="55" x2="82" y2="39" stroke="white" strokeWidth="2.8" strokeLinecap="round" opacity="0.65"/>
        <polygon points="82,39 74.5,40 80.5,47" fill="white" opacity="0.65"/>
      </svg>
    </div>
  );
}

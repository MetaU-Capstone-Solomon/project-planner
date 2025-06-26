import logo from '@/assets/images/logo.png';

export default function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <img src={logo} alt="ProPlan Logo" className="h-full w-full object-contain" />
    </div>
  );
}

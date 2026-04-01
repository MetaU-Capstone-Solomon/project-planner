const variants = {
  default:     'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
  accent:      'bg-[var(--accent-subtle)] text-[var(--accent)]',
  success:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning:     'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  destructive: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  admin:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  editor:      'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  viewer:      'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

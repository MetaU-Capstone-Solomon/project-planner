import { motion } from 'framer-motion';
import { spring } from '@/constants/motion';

// Spinner inline (small version, avoids circular dep before Task 8 creates the file)
function InlineSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const variants = {
  primary:     'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
  secondary:   'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-surface)]',
  ghost:       'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  destructive: 'bg-[var(--destructive)] text-white hover:opacity-90',
};

const sizes = {
  sm: 'h-8  px-3 text-sm  gap-1.5',
  md: 'h-10 px-4 text-sm  gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      transition={spring.snappy}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-colors duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <InlineSpinner />}
      {children}
    </motion.button>
  );
}

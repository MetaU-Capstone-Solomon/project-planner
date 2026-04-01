export default function Input({ label, error, className = '', leftIcon, rightIcon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]
            px-3 py-2.5 text-sm text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)]
            outline-none transition-all duration-150
            focus:border-[var(--accent)] focus:shadow-glow
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon  ? 'pl-9'  : ''}
            ${rightIcon ? 'pr-9'  : ''}
            ${error ? 'border-[var(--destructive)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-3 flex items-center text-[var(--text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}

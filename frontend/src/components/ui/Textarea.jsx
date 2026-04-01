import { useId } from 'react';

export default function Textarea({ label, error, className = '', ...props }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      )}
      <textarea
        id={id}
        className={`
          w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]
          px-3 py-2.5 text-sm text-[var(--text-primary)]
          placeholder:text-[var(--text-muted)]
          outline-none transition-all duration-150 resize-none
          focus:border-[var(--accent)] focus:shadow-glow
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-[var(--destructive)]' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
    </div>
  );
}

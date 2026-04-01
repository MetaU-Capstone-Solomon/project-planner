import { useState } from 'react';

export default function Tooltip({ content, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  const posClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] shadow-md ${posClasses[position]}`}>
          {content}
        </div>
      )}
    </div>
  );
}

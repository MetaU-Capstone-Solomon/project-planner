/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base:        'var(--bg-base)',
        surface:     'var(--bg-surface)',
        elevated:    'var(--bg-elevated)',
        border:      'var(--border)',
        accent:      'var(--accent)',
        success:     'var(--success)',
        warning:     'var(--warning)',
        destructive: 'var(--destructive)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sm:   'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
        md:   'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.10))',
        lg:   'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.12))',
        glow: 'var(--shadow-glow, 0 0 0 3px rgba(99,102,241,0.20))',
      },
    },
  },
  plugins: [],
};

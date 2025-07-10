/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Semantic color tokens for consistent theming
        surface: {
          primary: '#ffffff',
          secondary: '#f9fafb',
          tertiary: '#f3f4f6',
          card: '#ffffff',
          cardHover: '#f9fafb',
        },
        text: {
          primary: '#111827',
          secondary: '#6b7280',
          tertiary: '#9ca3af',
          inverse: '#ffffff',
          link: '#3b82f6',
          linkHover: '#2563eb',
        },
        border: {
          primary: '#e5e7eb',
          secondary: '#d1d5db',
          focus: '#3b82f6',
        },
        status: {
          success: {
            light: '#dcfce7',
            main: '#22c55e',
            dark: '#15803d',
            text: '#166534',
          },
          warning: {
            light: '#fef3c7',
            main: '#f59e0b',
            dark: '#d97706',
            text: '#92400e',
          },
          error: {
            light: '#fee2e2',
            main: '#ef4444',
            dark: '#dc2626',
            text: '#991b1b',
          },
          info: {
            light: '#dbeafe',
            main: '#3b82f6',
            dark: '#2563eb',
            text: '#1e40af',
          },
        },
        experience: {
          beginner: {
            bg: '#dcfce7',
            text: '#166534',
          },
          intermediate: {
            bg: '#fef3c7',
            text: '#92400e',
          },
          advanced: {
            bg: '#fed7aa',
            text: '#9a3412',
          },
          expert: {
            bg: '#fee2e2',
            text: '#991b1b',
          },
        },
        scope: {
          mvp: {
            bg: '#dbeafe',
            text: '#1e40af',
          },
          fullFeatured: {
            bg: '#e9d5ff',
            text: '#7c3aed',
          },
          enterprise: {
            bg: '#c7d2fe',
            text: '#4338ca',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

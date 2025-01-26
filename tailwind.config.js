/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '0 0' },
        },
        'subtle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'subtle-bounce-spin-pulse': {
          '0%': {
            transform: 'translateY(0) rotate(0deg) scale(1)',
            opacity: '1',
          },
          '25%': {
            transform: 'translateY(-5px) rotate(90deg) scale(0.95)',
            opacity: '0.7',
          },
          '50%': {
            transform: 'translateY(0) rotate(180deg) scale(1)',
            opacity: '1',
          },
          '75%': {
            transform: 'translateY(-5px) rotate(270deg) scale(0.95)',
            opacity: '0.7',
          },
          '100%': {
            transform: 'translateY(0) rotate(360deg) scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'subtle-bounce': 'subtle-bounce 1s infinite',
        'multi-animate': 'subtle-bounce-spin-pulse 3s infinite',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

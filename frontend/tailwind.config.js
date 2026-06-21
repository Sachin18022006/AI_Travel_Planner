/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // "Night flight" palette — deep ink navy with a worn-gold accent
        // and a terracotta "stamp" red, evoking a passport / boarding pass.
        ink: {
          950: '#0A1420',
          900: '#0E1B2C',
          800: '#15273C',
          700: '#1C334D',
          600: '#27466A'
        },
        paper: {
          50: '#FBF8F1',
          100: '#F6F1E7',
          200: '#ECE3CF'
        },
        gold: {
          400: '#E4BD72',
          500: '#D4A24C',
          600: '#B5823A'
        },
        stamp: {
          500: '#B5483D',
          600: '#943A31'
        },
        teal: {
          400: '#3C9C8F',
          500: '#1F6F65'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      backgroundImage: {
        grain: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)"
      },
      backgroundSize: {
        grain: '18px 18px'
      }
    }
  },
  plugins: []
};

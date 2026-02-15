module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ng: {
          bg: 'var(--ng-bg)',
          card: 'var(--ng-card)',
          neon: '#DC2626',
          surface: 'var(--ng-surface)',
          success: '#22C55E',
          danger: '#EF4444',
          warn: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
}

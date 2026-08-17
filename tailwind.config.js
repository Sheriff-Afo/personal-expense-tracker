/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Brand ────────────────────────────────────────────────────────────
        primary:       '#F08A00',   // sun amber  — one focal action per screen
        'primary-dark':'#C66B00',   // pressed / strong amber
        'primary-light':'#FFEDC9',  // selected / soft amber highlight
        earth:         '#5C4422',   // warm dark brown — headings, drawer strip
        // ── Semantic ─────────────────────────────────────────────────────────
        success:       '#2D7D46',   // income & positive balance
        'success-soft':'#E8F3EC',   // income soft background
        danger:        '#B33A2B',   // expense & negative balance
        'danger-soft': '#FBE7E3',   // expense soft background
        warning:       '#9A4F02',   // caution / missing evidence
        info:          '#2A5C8A',   // informational / neutral guidance
        // ── Surfaces ─────────────────────────────────────────────────────────
        surface:       '#FAF8F4',   // warm cream — main app background
        card:          '#FFFFFF',   // white card surface
        subtle:        '#F0EBE2',   // secondary sections / grouped content
        // ── Text ─────────────────────────────────────────────────────────────
        ink:           '#1A1610',   // near-black warm — primary text
        muted:         '#5E5443',   // warm secondary text
        faint:         '#9E9082',   // placeholder / metadata
        // ── Border ───────────────────────────────────────────────────────────
        border:        '#DDD5C7',   // warm tan dividers and outlines
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};

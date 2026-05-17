/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0F1B3C',
        navy2:   '#1A2D5A',
        blue:    '#2952CC',
        'blue-light': '#3D66E8',
        accent:  '#F0C040',
        accent2: '#E8A020',
        ggreen:  '#22C97A',
        gred:    '#E84040',
        bg:      '#F4F6FB',
        surface: '#FFFFFF',
        surface2:'#EEF1F8',
        gborder: '#D8DDEF',
        text1:   '#0F1B3C',
        text2:   '#4A5680',
        text3:   '#8892B0',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      boxShadow: {
        die:       '0 6px 0 #c0c8d8, 0 8px 16px rgba(0,0,0,0.35)',
        'die-held':'0 6px 0 #c8a820, 0 8px 16px rgba(240,192,64,0.4)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        trello: {
          blue: '#0079bf',
          'blue-dark': '#026aa7',
          'blue-darker': '#055a8c',
          navy: '#172b4d',
          gray: '#5e6c84',
          'gray-light': '#97a0af',
          'bg-light': '#fafbfc',
          'bg-gray': '#ebecf0',
        },
      },
    },
  },
  plugins: [],
};


// tailwind.config.js
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          gray: {
            900: '#0B0C2A', // Dark background
            800: '#1C1C3A', // Slightly lighter background
            700: '#2D2D4A', // Border colors
            600: '#3D3D5A', // Darker text
            400: '#9B9EA7', // Base text
            300: '#B7B7C4', // Lighter text
            200: '#D2D2DE', // Even lighter text
          },
          red: {
            500: '#E53637', // Primary red
            600: '#C11E1F', // Darker red for hover states
          },
        },
        fontFamily: {
          sans: ['Mulish', 'sans-serif'],
          display: ['Oswald', 'sans-serif'],
        },
      },
    },
    plugins: [],
    // This ensures Tailwind's classes take precedence over Ant Design's default styles
    important: true,
  }
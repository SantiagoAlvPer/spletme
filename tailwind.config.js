/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('tailwindcss').Config} */

const flowbite = require("flowbite-react/tailwind");
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    flowbite.content()
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#000000",
        "secondary": "#8ECAE6",
        "tertiary": "#219EBC",
        "quaternary": "#023047",
        "quinary": "#FB8500",
        "senary": "#D3D3D3",
        "septenary": "#6F6F6F",
      },
      fontSize:{
        "title": "1.5rem ",
        "subtitle": "1rem",
        "normal": "0.8rem",
      },
      fontFamily:{
        "custom" : ["Poppins", "sans-serif"]


      },
      backgroundImage:{
        'panel': "url('/src/assets/images/bgsplet.jpg')",

      },
      keyframes: {
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.25s ease-out",
      },

    },
  },
  plugins: [
    // eslint-disable-next-line no-undef
    require('tailwindcss-animated'),
    // eslint-disable-next-line no-undef
    require('tailwindcss-textshadow'),
    // eslint-disable-next-line no-undef
    require('flowbite/plugin'),
    flowbite.plugin()
    
  ],
}
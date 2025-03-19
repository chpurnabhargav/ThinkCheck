// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
      utilities: {
        ".animation-delay-2000": {
          animationDelay: "2s",
        },
        ".animation-delay-4000": {
          animationDelay: "4s",
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".animation-delay-2000": {
          animationDelay: "2s",
        },
        ".animation-delay-4000": {
          animationDelay: "4s",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
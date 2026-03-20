const postcssPresetEnv = require("postcss-preset-env");

module.exports = {
  plugins: [
    "@tailwindcss/postcss",
    postcssPresetEnv({
      stage: 3,
    }),
  ],
};

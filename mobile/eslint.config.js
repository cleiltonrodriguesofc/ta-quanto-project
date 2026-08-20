// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/*.test.js", "**/*.test.ts", "**/*.test.tsx", "**/__tests__/**/*", "jest-setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      }
    }
  },
  {
    files: ["server/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        console: "readonly",
        exports: "readonly"
      }
    }
  }
]);

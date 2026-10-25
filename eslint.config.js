import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Log through logError() / logWarning() (src/js/utils/log.js), which add the [Santo Terço] prefix
      'no-console': 'error',
    },
  },
  {
    // __SW_MANIFEST__ is filled in by the build (serviceWorker() in vite.config.js)
    files: ['src/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker, __SW_MANIFEST__: 'readonly' } },
  },
  {
    files: ['src/js/utils/log.js'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Vitest runs in Node with a simulated browser (happy-dom)
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

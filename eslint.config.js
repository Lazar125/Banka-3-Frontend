import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['cypress/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
      },
    },
  },
  {
    // Cypress plugins run in Node (db-reset spins up `pg` and reads files via
    // fs/process.env). Without node globals here ESLint flags `process` as
    // undefined even though it's the standard Node runtime global.
    files: ['cypress/plugins/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['cypress.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
])

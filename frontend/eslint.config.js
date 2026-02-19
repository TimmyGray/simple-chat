import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message: 'Use MUI <Button> instead of raw <button>. Import { Button } from "@mui/material". See docs/references/mui-theme-reference.md.',
        },
        {
          selector: 'JSXOpeningElement[name.name="input"]',
          message: 'Use MUI <TextField> or <Input> instead of raw <input>. Import { TextField } from "@mui/material".',
        },
        {
          selector: 'JSXOpeningElement[name.name="select"]',
          message: 'Use MUI <Select> instead of raw <select>. Import { Select } from "@mui/material".',
        },
        {
          selector: 'JSXOpeningElement[name.name="textarea"]',
          message: 'Use MUI <TextField multiline> instead of raw <textarea>. Import { TextField } from "@mui/material".',
        },
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message: 'Hardcoded hex color detected. Use MUI theme tokens instead (e.g., theme.palette.primary.main). Define custom colors in frontend/src/theme.ts. See docs/references/mui-theme-reference.md.',
        },
      ],
    },
  },
  {
    // theme.ts is where hex colors SHOULD be defined — exempt it from the hex color rule
    files: ['src/theme.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message: 'Use MUI <Button> instead of raw <button>.',
        },
        {
          selector: 'JSXOpeningElement[name.name="input"]',
          message: 'Use MUI <TextField> or <Input> instead of raw <input>.',
        },
        {
          selector: 'JSXOpeningElement[name.name="select"]',
          message: 'Use MUI <Select> instead of raw <select>.',
        },
        {
          selector: 'JSXOpeningElement[name.name="textarea"]',
          message: 'Use MUI <TextField multiline> instead of raw <textarea>.',
        },
      ],
    },
  },
])

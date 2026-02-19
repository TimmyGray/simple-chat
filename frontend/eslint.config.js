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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
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
      ],
    },
  },
])

// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      'no-console': 'error',
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../auth/*'],
            message: 'Cross-module import detected. Do not import from auth/ internals. Use NestJS dependency injection: import AuthModule in your module.ts and inject AuthService via constructor. Exception: chat/ may import auth guards.',
          },
          {
            group: ['../chat/*'],
            message: 'Cross-module import detected. Do not import from chat/ internals. Use NestJS dependency injection: import ChatModule in your module.ts and inject ChatService via constructor.',
          },
          {
            group: ['../uploads/*'],
            message: 'Cross-module import detected. Do not import from uploads/ internals. Use NestJS dependency injection: import UploadsModule in your module.ts and inject the service via constructor.',
          },
          {
            group: ['../health/*'],
            message: 'Cross-module import detected. Do not import from health/ internals. Use NestJS dependency injection: import HealthModule in your module.ts and inject the service via constructor.',
          },
          {
            group: ['../models/*'],
            message: 'Cross-module import detected. Do not import from models/ internals. Use NestJS dependency injection: import ModelsModule in your module.ts and inject ModelsService via constructor.',
          },
        ],
      }],
    },
  },
  {
    // chat/ is allowed to import from auth/ (guards, decorators, interfaces)
    files: ['src/chat/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../chat/*'],
            message: 'Cross-module import detected. Do not import from chat/ internals.',
          },
          {
            group: ['../uploads/*'],
            message: 'Cross-module import detected. Do not import from uploads/ internals.',
          },
          {
            group: ['../health/*'],
            message: 'Cross-module import detected. Do not import from health/ internals.',
          },
          {
            group: ['../models/*'],
            message: 'Cross-module import detected. Do not import from models/ internals.',
          },
        ],
      }],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
);

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends('plugin:@typescript-eslint/recommended'),
  ...compat.extends('prettier'),
  {
    rules: {
      'no-shadow': 'error',
      'no-nested-ternary': 'error',
      'newline-before-return': 'error',
    },
  },
  {
    ignores: ['dist', 'node_modules', '**/use-toast.ts', 'tailwind.config.js'],
  },
];

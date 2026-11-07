import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'gallery-dist/', 'storybook-static/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Tooling scripts and configs run in Node.
    files: ['scripts/**/*.mjs', '*.config.{js,ts}', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
);

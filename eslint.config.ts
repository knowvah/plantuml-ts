import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default tseslint.config([
  {
    ignores: ['dist/**', 'dist-demo/**', 'coverage/**', 'node_modules/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    // `scripts/` carries a few hand-written `.mjs`/`.js` helpers that no
    // tsconfig includes, so the type-checked rules cannot resolve services
    // for them. Lint them untyped rather than excluding them outright.
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // `scripts/` and the root `*.config.ts` files are NOT in the root tsconfig (which includes src/tests/demo
    // only), so `project: true` -- nearest-tsconfig resolution -- cannot see
    // it. Most script files happened to be reachable transitively as imports
    // from `tests`; the ones nothing imports (e.g. visual-qa-dot.ts) were
    // not, and failed to parse. Name their real project instead.
    files: ['scripts/**/*.ts', '*.config.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json'],
        tsconfigRootDir,
      },
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'demo/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);

// Flat ESLint config. Enforces the quality bar described in docs/conventions.md.
// Tight limits up front. If a rule fights real algorithm code, relax it per-file with eslint-disable
// and a one-line justification — never weaken the global limit silently.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      // COPYRIGHT_HEADER_TEMPLATE.ts is a license-attribution template, not
      // compiled code — not part of any package's tsconfig.
      'COPYRIGHT_HEADER_TEMPLATE.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  unicorn.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { import: importPlugin },
    rules: {
      // ── Size limits: keep classes and methods small ──────────────────────
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-depth': ['error', 3],
      'max-classes-per-file': ['error', 1],
      complexity: ['error', 8],

      // ── No magic constants: force enums or named exports ─────────────────
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],

      // String literals used as a closed set of values must be modeled as enums or const objects.
      // We can't perfectly detect this; the rules below catch the most common offenders.
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      // Ban inline string-union types in public signatures: forces a named type/enum.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSUnionType[types.length>=2]:matches([types.0.type='TSLiteralType'][types.0.literal.type='Literal'])",
          message:
            'Inline string/number union types are banned. Define a named enum (or const object as const) in a types module and import it.',
        },
        {
          selector: 'Literal[value=/.{80,}/]',
          message: 'String literals longer than 80 chars belong in a constants module.',
        },
      ],

      // ── Type strictness ──────────────────────────────────────────────────
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // too noisy; revisit per-package
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // ── Imports ──────────────────────────────────────────────────────────
      'import/no-cycle': ['error', { maxDepth: 10 }],
      'import/no-self-import': 'error',
      'import/no-default-export': 'error', // named exports only; default exports break refactors

      // ── Style noise that hides smells ────────────────────────────────────
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-param-reassign': ['error', { props: true }],
      'unicorn/prevent-abbreviations': 'off', // graph/algorithm code uses standard short names (src, dst, deg, …)
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    },
  },
  // Tests: relax size limits — table-driven tests are naturally long.
  {
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-depth': 'off',
      complexity: 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  // Error class families are an explicit exception to the "one class per file" rule:
  // an enum of names plus a base class plus its small subclasses is one cohesive unit.
  {
    files: ['**/errors.ts'],
    rules: {
      'max-classes-per-file': 'off',
    },
  },
  // Example scripts are documentation, not production code: console output is the point,
  // and inline prose descriptions are allowed to exceed the 80-char string-literal limit.
  {
    files: ['**/examples/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  // Config files at repo root are not part of any package tsconfig — use untyped linting for them.
  {
    files: ['*.config.ts', '*.config.mts', 'eslint.config.ts', 'vitest.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'import/no-default-export': 'off', // config files conventionally default-export
      'no-restricted-syntax': 'off', // long rule messages are intentional here
    },
  },
  prettier,
);

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'security', 'prettier'],
  extends: [
    'plugin:json/recommended',
    'plugin:security/recommended',
    'prettier',
    // "prettier/@typescript-eslint",
  ],
  parserOptions: {
    ecmaVersion: 2018,
    ecmaFeatures: {
      impliedStrict: true,
    },
    sourceType: 'module',
  },
  env: {
    jest: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/ban-types': [
      'error',
      {
        extendDefaults: true,
        types: {
          '{}': false,
        },
      },
    ],
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/brace-style': ['error', '1tbs'],
    camelcase: ['error', { properties: 'never', ignoreDestructuring: true, ignoreGlobals: true }],
    '@typescript-eslint/no-array-constructor': 'warn',
    '@typescript-eslint/no-extraneous-class': 'warn',
    '@typescript-eslint/no-for-in-array': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-use-before-define': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-useless-constructor': 'warn',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
    '@typescript-eslint/unified-signatures': 'error',

    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'info'],
      },
    ],
    // "prefer-destructuring": ["error", { object: true, array: false }],

    // "prettier/prettier": [
    //   "error",
    //   {
    //     singleQuote: true,
    //     trailingComma: "all",
    //   },
    // ],
  },

  settings: {
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', 'src'],
        extensions: ['.js', '.ts', '.json'],
      },
    },
  },
};

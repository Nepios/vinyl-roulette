module.exports = {
  root: true,  
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // Allow unused args that start with underscore
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
  },
  overrides: [
    {
      // Jest and test files
      files: ['**/__tests__/**/*', '**/*.test.*', 'jest.setup.js'],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        jest: true,
        Buffer: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'react/display-name': 'off',
      },
    },
    {
      // Mock files
      files: ['**/__mocks__/**/*'],
      globals: {
        Buffer: true,
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Config files
      files: ['*.config.js', 'shim.js'],
      env: {
        node: true,
      },
      globals: {
        global: true,
        Buffer: true,
        localStorage: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'no-undef': 'off',
        'dot-notation': 'off',
      },
    },
  ],
};

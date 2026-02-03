module.exports = {
  extends: [
    'eslint:recommended',
  ],
  plugins: ['security'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  rules: {
    // Code Quality Rules
    'no-console': 'off', // Server logging is necessary
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    
    // Security Rules - Critical for API servers
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // API Security Best Practices
    'no-template-curly-in-string': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': 'error',
    
    // Express.js specific
    'no-undef': 'error',
    'no-redeclare': 'error',
    
    // Solana API security
    'no-process-env': 'off', // We need process.env for configuration
  },
  globals: {
    // Add any global variables used in your API
    'process': 'readonly',
    'Buffer': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',
  },
};
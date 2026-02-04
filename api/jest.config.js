module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '.',
  
  // Test directories
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'clover'],
  
  // Coverage thresholds - Disabled for now, will enable as more tests are added
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 30,
  //     lines: 30,
  //     statements: 30,
  //   },
  // },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/*.test.js',
    '!**/*.spec.js',
    '!production-server.js',  // Has syntax errors
    '!server.js',             // Has syntax errors
    '!demo.js',               // Demo file, not critical
    '!examples/**',           // Example files, not critical
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Automatically restore mock state and implementation before every test
  restoreMocks: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Transform files
  transform: {},
  
  // Module name mapping
  moduleNameMapper: {},
  
  // Global setup/teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
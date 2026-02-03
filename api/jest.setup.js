// Jest setup file for API tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Mock external services
const mockSolanaConnection = {
  getBalance: jest.fn().mockResolvedValue(1000000),
  getAccountInfo: jest.fn().mockResolvedValue(null),
  getRecentBlockhash: jest.fn().mockResolvedValue({
    blockhash: 'test-blockhash',
    feeCalculator: { lamportsPerSignature: 5000 },
  }),
};

// Mock Solana Web3 connection
jest.mock('@solana/web3.js', () => ({
  ...jest.requireActual('@solana/web3.js'),
  Connection: jest.fn().mockImplementation(() => mockSolanaConnection),
}));

// Mock GitHub API
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        get: jest.fn().mockResolvedValue({ data: { name: 'test-repo' } }),
      },
      actions: {
        listWorkflowRuns: jest.fn().mockResolvedValue({ data: { workflow_runs: [] } }),
      },
    },
  })),
}));

// Console override for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress console errors and warnings during tests unless explicitly needed
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test helpers
global.testHelpers = {
  // Create a mock request object
  createMockRequest: (overrides = {}) => ({
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  }),
  
  // Create a mock response object
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Setup test database or mock data as needed
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});
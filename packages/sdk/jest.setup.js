// Jest setup file for SDK tests

// Mock fetch for testing
global.fetch = jest.fn();

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
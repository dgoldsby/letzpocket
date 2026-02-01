// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Global test utilities
const mockMutationObserver = jest.fn().mockImplementation((callback: any) => ({
  disconnect: jest.fn(),
  observe: jest.fn((element: any, initObject: any) => {}),
  takeRecords: jest.fn(() => [])
}));

global.MutationObserver = mockMutationObserver as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn().mockImplementation(() => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
  takeRecords: jest.fn(() => [])
}));

global.IntersectionObserver = mockIntersectionObserver as any;

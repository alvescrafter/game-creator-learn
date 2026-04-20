// Jest setup file — mock Prisma and prevent database connections during tests

// Mock the database module before any imports
jest.mock('../database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    usage: {
      create: jest.fn(),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return { prisma: mockPrisma };
});

// Mock passport to avoid OAuth strategy setup issues
jest.mock('passport', () => ({
  initialize: jest.fn(() => (req, res, next) => next()),
  use: jest.fn(),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
  authenticate: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('passport-google-oauth20', () => ({
  Strategy: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('passport-facebook', () => ({
  Strategy: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('passport-github', () => ({
  Strategy: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('passport-local', () => ({
  Strategy: jest.fn().mockImplementation(() => ({})),
}));
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': { isolatedModules: true },
  },
  testMatch: ['**/tests/**/*.test.ts'],
};

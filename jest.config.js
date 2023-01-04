/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  transform: {
    '^.+\\.ts$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['dotenv/config'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'lcov',
    'text',
    'cobertura',
    'json-summary',
    'json',
    'text-summary',
    'json'
  ],
  preset: '@shelf/jest-mongodb',
  watchPathIgnorePatterns: ['globalConfig'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testTimeout: 40 * 1000,
  globals: { // won't work with jest-mongodb
  }
}

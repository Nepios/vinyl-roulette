module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-encrypted-storage|react-native-keychain|react-native-crypto|react-native-randombytes|react-native-inappbrowser-reborn)/)',
  ],
  moduleNameMapper: {
    '^react-native-encrypted-storage$': '<rootDir>/__mocks__/react-native-encrypted-storage.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.js',
    '^react-native-crypto$': '<rootDir>/__mocks__/react-native-crypto.js',
  },
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!node_modules/**',
    '!__tests__/**',
    '!__mocks__/**',
    '!jest.setup.js',
    '!jest.config.js',
  ],
};

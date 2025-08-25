module.exports = {
    preset: 'jest-expo',
    testMatch: ['**/test.ts?(x)'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(jest-)?(@jellyfin/sdk|@expo|expo|@expo/.*|expo-.*|@react-native|react-native|react-clone-referenced-element|@react-native-community|expo-modules-core|@unimodules|unimodules|sentry-expo|native-base|react-navigation|@react-navigation|@sentry/react-native|react-native-svg))',
    ],
};

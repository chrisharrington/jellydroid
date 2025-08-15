module.exports = {
    preset: 'jest-expo',
    testMatch: ['**/test.ts?(x)'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};

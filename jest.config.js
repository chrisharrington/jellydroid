module.exports = {
    preset: 'jest-expo',
    testMatch: ['**/test.ts?(x)'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};

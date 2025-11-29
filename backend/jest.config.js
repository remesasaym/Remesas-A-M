// backend/jest.config.js
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'routes/**/*.js',
        'middleware/**/*.js',
        'services/**/*.js',
        '!**/__tests__/**',
        '!**/node_modules/**',
    ],
    testMatch: [
        '**/__tests__/**/*.test.js',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
};

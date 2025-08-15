// Global test setup for Jest
// This file is run before all tests

// Suppress act() warnings globally for all tests
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        const message = args[0]?.toString() || '';

        // Suppress React act() warnings that are expected in animation-based components
        if (message.includes('wrapped in act') || message.includes('useInsertionEffect must not schedule updates')) {
            // Suppress these specific errors
            return;
        }

        // Let other errors through
        originalConsoleError.call(console, ...args);
    };
});

afterAll(() => {
    // Restore original console.error after all tests
    console.error = originalConsoleError;
});

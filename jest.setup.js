// Prevent console.error from cluttering test output.
const originalConsoleError = console.error;
beforeAll(() => {
    console.error = () => {};
});

afterAll(() => {
    // Restore original console.error after all tests.
    console.error = originalConsoleError;
});

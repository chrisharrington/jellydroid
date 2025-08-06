import { useCallback } from 'react';

/**
 * A hook that provides a retry mechanism for functions that may fail.
 *
 * @returns An object containing the retry function
 */
export function useRetry() {
    /**
     * Retries a test function until it succeeds or times out.
     *
     * @param testFunction - The function to retry. Should throw an error on failure.
     * @param timeout - The maximum time to retry in milliseconds. Defaults to 10 seconds.
     * @returns A promise that resolves when the test function succeeds
     * @throws An error if the timeout is exceeded before the test function succeeds
     */
    const retry = useCallback(async <T>(testFunction: () => T | Promise<T>, timeout: number = 10_000): Promise<T> => {
        const startTime = Date.now(),
            retryDelay = 100; // Initial retry delay in milliseconds.
        let lastError: Error | unknown;

        while (Date.now() - startTime < timeout) {
            try {
                return await testFunction();
            } catch (error) {
                lastError = error;

                // Wait before retrying.
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        // Timeout exceeded
        throw new Error(
            `Retry timeout exceeded after ${timeout}ms. Last error: ${
                lastError instanceof Error ? lastError.message : String(lastError)
            }`
        );
    }, []);

    return { retry };
}

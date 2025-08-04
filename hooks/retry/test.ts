import { renderHook } from '@testing-library/react-native';
import { useRetry } from './index';

describe('useRetry', () => {
    it('should return a retry function', () => {
        const { result } = renderHook(() => useRetry());

        expect(result.current).toHaveProperty('retry');
        expect(typeof result.current.retry).toBe('function');
    });

    it('should succeed immediately if test function passes', async () => {
        const { result } = renderHook(() => useRetry());
        const mockTestFunction = jest.fn().mockReturnValue('success');

        const returnValue = await result.current.retry(mockTestFunction);

        expect(mockTestFunction).toHaveBeenCalledTimes(1);
        expect(returnValue).toBe('success');
    });

    it('should retry until test function succeeds', async () => {
        const { result } = renderHook(() => useRetry());
        const mockTestFunction = jest
            .fn()
            .mockRejectedValueOnce(new Error('First failure'))
            .mockRejectedValueOnce(new Error('Second failure'))
            .mockResolvedValue('success');

        const returnValue = await result.current.retry(mockTestFunction, 1000); // 1 second timeout

        expect(mockTestFunction).toHaveBeenCalledTimes(3);
        expect(returnValue).toBe('success');
    });

    it('should throw error when timeout is exceeded', async () => {
        const { result } = renderHook(() => useRetry());
        const mockTestFunction = jest.fn().mockRejectedValue(new Error('Always fails'));

        await expect(result.current.retry(mockTestFunction, 200)).rejects.toThrow('Retry timeout exceeded after 200ms');
        await expect(result.current.retry(mockTestFunction, 200)).rejects.toThrow('Always fails');
    });

    it('should work with async test functions', async () => {
        const { result } = renderHook(() => useRetry());
        const mockAsyncTestFunction = jest.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'async success';
        });

        const returnValue = await result.current.retry(mockAsyncTestFunction);

        expect(mockAsyncTestFunction).toHaveBeenCalledTimes(1);
        expect(returnValue).toBe('async success');
    });

    it('should use default timeout of 10 seconds', async () => {
        const { result } = renderHook(() => useRetry());
        const mockTestFunction = jest
            .fn()
            .mockRejectedValueOnce(new Error('First failure'))
            .mockResolvedValue('success');

        // This should succeed before the 10 second timeout
        const returnValue = await result.current.retry(mockTestFunction);

        expect(mockTestFunction).toHaveBeenCalledTimes(2);
        expect(returnValue).toBe('success');
    }, 15000); // Give Jest 15 seconds for this test
});

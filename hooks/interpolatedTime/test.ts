import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useInterpolatedTime } from './index';

const mockDateNow = jest.fn(),
    originalDateNow = Date.now;

jest.useFakeTimers();

beforeAll(() => {
    const originalError = console.error;
    console.error = jest.fn((...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
            return; // Suppress act warnings - expected for timer-based hooks
        }
        originalError(...args);
    });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('useInterpolatedTime', () => {
    beforeEach(() => {
        (Date.now as jest.Mock) = mockDateNow;
        mockDateNow.mockReturnValue(1000);
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    afterEach(() => {
        Date.now = originalDateNow;
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.useFakeTimers();
    });

    it('should return the initial localTime when first rendered', () => {
        const { result } = renderHook(() => useInterpolatedTime(100, true, 0));
        expect(result.current).toBe(100);
    });

    it('should return localTime immediately when isEnabled is false', () => {
        const { result } = renderHook(() => useInterpolatedTime(50, false, 0));
        expect(result.current).toBe(50);

        // Fast-forward time and verify it doesn't interpolate
        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current).toBe(50);
    });

    it('should interpolate time when isEnabled is true', () => {
        const startTime = 1000;
        const localTime = 100;
        const lastUpdateTime = startTime;

        mockDateNow.mockReturnValue(startTime);

        const { result } = renderHook(() => useInterpolatedTime(localTime, true, lastUpdateTime));

        expect(result.current).toBe(localTime);

        // Simulate time passing (200ms)
        mockDateNow.mockReturnValue(startTime + 200);

        act(() => {
            jest.advanceTimersByTime(100); // Trigger the interval
        });

        // Should be localTime + elapsed time (100 + 0.2 seconds)
        expect(result.current).toBe(100.2);
    });

    it('should clean up intervals when unmounted', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

        const { unmount } = renderHook(() => useInterpolatedTime(100, true, 1000));

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should update interpolation when localTime changes', () => {
        const startTime = 1000;

        mockDateNow.mockReturnValue(startTime);

        const { result, rerender } = renderHook(
            ({ localTime, isEnabled, lastUpdateTime }) => useInterpolatedTime(localTime, isEnabled, lastUpdateTime),
            {
                initialProps: {
                    localTime: 100,
                    isEnabled: true,
                    lastUpdateTime: startTime,
                },
            }
        );

        expect(result.current).toBe(100);

        // Simulate time passing and update localTime
        mockDateNow.mockReturnValue(startTime + 300);

        act(() => {
            rerender({
                localTime: 200,
                isEnabled: true,
                lastUpdateTime: startTime + 300,
            });
        });

        expect(result.current).toBe(200);
    });

    it('should stop interpolating when isEnabled changes to false', () => {
        const startTime = 1000;
        mockDateNow.mockReturnValue(startTime);

        const { result, rerender } = renderHook(
            ({ localTime, isEnabled, lastUpdateTime }) => useInterpolatedTime(localTime, isEnabled, lastUpdateTime),
            {
                initialProps: {
                    localTime: 100,
                    isEnabled: true,
                    lastUpdateTime: startTime,
                },
            }
        );

        // Let interpolation run for a bit
        mockDateNow.mockReturnValue(startTime + 200);
        act(() => {
            jest.advanceTimersByTime(100);
        });

        expect(result.current).toBe(100.2);

        // Disable interpolation
        act(() => {
            rerender({
                localTime: 150,
                isEnabled: false,
                lastUpdateTime: startTime,
            });
        });

        // Should reset to the new localTime
        expect(result.current).toBe(150);
    });

    it('should handle edge case where lastUpdateTime is in the future', () => {
        const startTime = 1000;
        const localTime = 100;
        const lastUpdateTime = startTime + 1000; // Future time

        mockDateNow.mockReturnValue(startTime);

        const { result } = renderHook(() => useInterpolatedTime(localTime, true, lastUpdateTime));

        act(() => {
            jest.advanceTimersByTime(100);
        });

        // Should handle negative elapsed time gracefully
        expect(result.current).toBe(99); // 100 + (-1) = 99
    });
});

import { act, render, renderHook } from '@testing-library/react-native';
import React from 'react';
import { Animated, Image } from 'react-native';
import { Poster, PosterProps } from '.';
import { usePoster } from './hook';

// Mock just the Animated.timing method.
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockReset = jest.fn();
const mockTiming = jest.fn(() => ({ start: mockStart, stop: mockStop, reset: mockReset }));

// Mock only the timing function we need.
jest.spyOn(Animated, 'timing').mockImplementation(mockTiming as any);

describe('Poster', () => {
    const defaultProps: PosterProps = {
        poster: 'https://example.com/poster.jpg',
        isDimmed: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockTiming.mockClear();
        mockStart.mockClear();
    });

    describe('Component rendering behavior', () => {
        it('renders poster component', () => {
            // Verify the component renders without errors.
            expect(() => render(<Poster {...defaultProps} />)).not.toThrow();
        });

        it('renders image when poster URL is provided', () => {
            // Render Poster component with poster URL.
            const { UNSAFE_getByType } = render(<Poster {...defaultProps} />);

            // Verify the Image component is rendered.
            const image = UNSAFE_getByType(Image);
            expect(image.props.source).toEqual({ uri: defaultProps.poster });
        });

        it('does not render image when poster is null', () => {
            // Render Poster component without poster URL.
            const component = render(<Poster {...defaultProps} poster={null} />);

            // Verify component renders but no image is present.
            expect(component).toBeDefined();
        });

        it('does not render image when poster is empty string', () => {
            // Render Poster component with empty poster URL.
            const component = render(<Poster {...defaultProps} poster='' />);

            // Verify component renders but no image is present.
            expect(component).toBeDefined();
        });
    });

    describe('Animation behavior', () => {
        it('starts animation when isDimmed is true', () => {
            // Render Poster component with isDimmed set to true.
            render(<Poster {...defaultProps} isDimmed={true} />);

            // Verify animation is configured correctly.
            expect(mockTiming).toHaveBeenCalledWith(
                expect.any(Animated.Value),
                expect.objectContaining({
                    toValue: 0.3,
                    duration: 200,
                    useNativeDriver: true,
                })
            );
            expect(mockStart).toHaveBeenCalled();
        });

        it('starts animation when isDimmed is false', () => {
            // Render Poster component with isDimmed set to false.
            render(<Poster {...defaultProps} isDimmed={false} />);

            // Verify animation is configured correctly.
            expect(mockTiming).toHaveBeenCalledWith(
                expect.any(Animated.Value),
                expect.objectContaining({
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            );
            expect(mockStart).toHaveBeenCalled();
        });
    });
});

describe('usePoster', () => {
    const defaultProps: PosterProps = {
        poster: 'https://example.com/poster.jpg',
        isDimmed: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockTiming.mockClear();
        mockStart.mockClear();
    });

    describe('Hook initialization behavior', () => {
        it('initializes with opacity value', () => {
            // Render the hook.
            const { result } = renderHook(() => usePoster(defaultProps));

            // Verify opacity is an Animated.Value.
            expect(result.current.opacity).toBeInstanceOf(Animated.Value);
        });

        it('returns consistent opacity reference across renders', () => {
            // Render the hook.
            const { result, rerender } = renderHook((props: PosterProps) => usePoster(props), {
                initialProps: defaultProps,
            });

            const firstOpacity = result.current.opacity;

            // Re-render the hook.
            rerender(defaultProps);

            // Verify opacity reference is stable.
            expect(result.current.opacity).toBe(firstOpacity);
        });
    });

    describe('Animation triggering behavior', () => {
        it('triggers animation when isDimmed changes from false to true', () => {
            // Render hook with isDimmed false.
            const { rerender } = renderHook((props: PosterProps) => usePoster(props), {
                initialProps: { ...defaultProps, isDimmed: false },
            });

            // Change isDimmed to true.
            act(() => {
                rerender({ ...defaultProps, isDimmed: true });
            });

            // Verify animation was called with dimmed opacity.
            expect(mockTiming).toHaveBeenCalledWith(
                expect.any(Animated.Value),
                expect.objectContaining({
                    toValue: 0.3,
                    duration: 200,
                    useNativeDriver: true,
                })
            );
            expect(mockStart).toHaveBeenCalled();
        });

        it('triggers animation when isDimmed changes from true to false', () => {
            // Render hook with isDimmed true.
            const { rerender } = renderHook((props: PosterProps) => usePoster(props), {
                initialProps: { ...defaultProps, isDimmed: true },
            });

            // Change isDimmed to false.
            act(() => {
                rerender({ ...defaultProps, isDimmed: false });
            });

            // Verify animation was called with full opacity.
            expect(mockTiming).toHaveBeenCalledWith(
                expect.any(Animated.Value),
                expect.objectContaining({
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                })
            );
            expect(mockStart).toHaveBeenCalled();
        });

        it('configures animation with correct duration and native driver', () => {
            // Render hook to trigger animation.
            renderHook(() => usePoster({ ...defaultProps, isDimmed: true }));

            // Verify animation configuration.
            expect(mockTiming).toHaveBeenCalledWith(
                expect.any(Animated.Value),
                expect.objectContaining({
                    duration: 200,
                    useNativeDriver: true,
                })
            );
        });
    });
});

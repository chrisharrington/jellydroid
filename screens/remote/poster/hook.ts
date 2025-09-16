import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { PosterProps } from '.';

/**
 * Custom hook for managing Poster state and behavior.
 * Handles animated opacity transitions based on dimmed state.
 *
 * @param props - The Poster props containing the dimmed state
 * @returns Object containing the animated opacity value
 */
export function usePoster(props: PosterProps) {
    const { isDimmed } = props,
        opacity = useRef(new Animated.Value(1)).current;

    // Animate opacity when dimmed state changes.
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isDimmed ? 0.3 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isDimmed, opacity]);

    return {
        opacity,
    };
}

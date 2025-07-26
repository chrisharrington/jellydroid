import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook for handling animated background colour transitions in a pressable.
 *
 * @param defaultColour - Default background colour.
 * @param pressedColour - Background colour when pressed.
 * @returns Animation value, press handlers, and interpolated background colour.
 */
export function useAnimatedPressable(defaultColour: string, pressedColour: string) {
    const animation = useRef(new Animated.Value(0)).current;

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [defaultColour, pressedColour],
    });

    return {
        handlePressIn,
        handlePressOut,
        backgroundColor,
    };

    /**
     * Triggers the animation to transition to the pressed colour.
     */
    function handlePressIn() {
        Animated.timing(animation, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }

    /**
     * Triggers the animation to transition back to the default colour.
     */
    function handlePressOut() {
        Animated.timing(animation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
        }).start();
    }
}

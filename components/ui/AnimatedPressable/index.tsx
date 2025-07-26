import { Colours } from '@/constants/colours';
import React from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useAnimatedPressable } from './hook';
import styles from './style';

/**
 * Props for AnimatedPressable component.
 *
 * @property children - Required. Content to render inside the pressable.
 * @property onPress - Optional. Handler for press event.
 * @property style - Optional. Style for the container.
 * @property defaultColor - Optional. Default background color.
 * @property pressedColor - Optional. Background color when pressed.
 */
export type AnimatedPressableProps = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    defaultColor?: string;
    pressedColor?: string;
};

/**
 * AnimatedPressable provides a Pressable with a smooth background color transition.
 *
 * @param props - AnimatedPressableProps
 * @returns Animated Pressable component
 */
export function AnimatedPressable({
    children,
    onPress,
    style,
    defaultColor = Colours.background2,
    pressedColor = Colours.background3,
}: AnimatedPressableProps) {
    const { handlePressIn, handlePressOut, backgroundColor } = useAnimatedPressable(defaultColor, pressedColor);

    return (
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View style={[styles.container, { backgroundColor }, style]}>{children}</Animated.View>
        </Pressable>
    );
}

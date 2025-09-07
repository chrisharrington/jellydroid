import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, Easing } from 'react-native';
import { useToast } from '../toast';

const { height: screenHeight } = Dimensions.get('window');

/**
 * A hook that manages the animation and visibility state of a selector component.
 *
 * @param visible - Boolean flag indicating whether the selector should be visible
 * @param onSelectValue - Optional callback function called when a value is selected
 * @param onClose - Optional callback function called when the selector is closed
 * @returns An object containing:
 * - slideAnim: Animated.Value for slide animation
 * - fadeAnim: Animated.Value for fade animation
 * - isVisible: Boolean indicating if selector is currently visible
 * - handleSelectValue: Callback function to handle value selection
 *
 * @remarks
 * This hook manages two parallel animations:
 * 1. A slide animation that moves the selector from the bottom of the screen
 * 2. A fade animation that controls the opacity
 *
 * When the selector becomes visible, it slides up from the bottom and fades in.
 * When hidden, it slides down and fades out.
 */
export function useSelector(
    visible: boolean,
    onSelectValue?: (value: string | number | null) => void,
    onClose?: () => void
) {
    const slideAnim = useRef(new Animated.Value(screenHeight)).current,
        fadeAnim = useRef(new Animated.Value(0)).current,
        [isVisible, setIsVisible] = useState(false),
        toast = useToast();

    // Handle hardware back button to close selector instead of navigating back
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (visible && isVisible) {
                    // Selector is visible, close it instead of going back
                    if (onClose) onClose();
                    return true; // Prevent default back behavior
                }
                return false; // Allow default back behavior
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [visible, isVisible, onClose])
    );

    useEffect(() => {
        if (visible) {
            // Show the selector.
            setIsVisible(true);

            // Run slide up and fade in animations in parallel with optimized easing.
            Animated.parallel([
                // Animate selector sliding up from bottom with spring-like easing.
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 350,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),

                // Animate selector fading in with smooth easing.
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (isVisible) {
            // Hide any toasts that may be visible.
            toast.hide();

            // Run slide down and fade out animations in parallel with optimized easing.
            Animated.parallel([
                // Animate selector sliding down to bottom with smooth easing.
                Animated.timing(slideAnim, {
                    toValue: screenHeight,
                    duration: 280,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),

                // Animate selector fading out with smooth easing.
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    easing: Easing.in(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsVisible(false);
            });
        }
    }, [visible, slideAnim, fadeAnim, isVisible, toast]);

    /**
     * Handles the selection of a value from a selector component.
     *
     * @param value - The selected value, which can be either a string or null
     * @returns void
     *
     * @remarks
     * This callback function performs two operations:
     * 1. Calls the onSelectValue handler with the selected value if it exists
     * 2. Calls the onClose handler if it exists
     */
    const handleSelectValue = useCallback(
        (value: string | number | null) => {
            if (onSelectValue) onSelectValue(value);
            if (onClose) onClose();
        },
        [onSelectValue, onClose]
    );

    return {
        slideAnim,
        fadeAnim,
        isVisible,
        handleSelectValue,
    };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

export function useSelector(visible: boolean, onSelectValue?: (value: string) => void, onClose?: () => void) {
    const slideAnim = useRef(new Animated.Value(screenHeight)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else if (isVisible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: screenHeight,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setIsVisible(false);
            });
        }
    }, [visible, slideAnim, fadeAnim, isVisible]);

    const handleSelectValue = useCallback(
        (value: string) => {
            if (onSelectValue) {
                onSelectValue(value);
            }
            if (onClose) {
                onClose();
            }
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

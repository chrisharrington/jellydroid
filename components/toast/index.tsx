import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Portal } from 'react-native-portalize';
import styles from './style';

type ToastType = 'success' | 'error';

type ToastMessage = {
    message: string;
    type: ToastType;
};

type ToastContextType = {
    /** Required. Function to display a success toast with the specified message. */
    success: (message: string) => void;

    /** Required. Function to display an error toast with the specified message. */
    error: (message: string) => void;

    /** Required. Function to immediately hide any currently visible toast. */
    hide: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

type ToastProviderProps = {
    children: ReactNode;
};

/**
 * A provider component that manages toast notifications throughout the application.
 *
 * This component provides a context for displaying temporary toast messages with animations.
 * Instead of stacking multiple toasts, when a new toast arrives while one is visible,
 * the current toast slides down, updates its content, then slides back up.
 *
 * @param props - The component props
 * @param props.children - The child components that will have access to the toast context
 *
 * @returns A context provider that renders children and manages toast notifications
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourAppContent />
 *     </ToastProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Toasts are automatically dismissed after 5 seconds
 * - Only one toast is visible at a time
 * - New toasts cause the current toast to slide down, update, then slide back up
 * - Uses React Native Portal to render toasts above other content
 * - Provides success() and error() methods through context
 */
export function ToastProvider({ children }: ToastProviderProps) {
    const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
    const translateY = useRef(new Animated.Value(50)).current; // Start slightly below with subtle offset
    const opacity = useRef(new Animated.Value(0)).current; // Start invisible
    const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isToastVisibleRef = useRef<boolean>(false);

    /**
     * Creates and displays a toast notification with the specified message and type.
     *
     * This method handles the complete lifecycle of a toast notification:
     * - If no toast is currently visible, fades and slides the new toast in
     * - If a toast is already visible, fades it out with subtle slide, updates content, then fades back in
     * - Sets up automatic dismissal after 5 seconds with fade and slide animations
     *
     * @param message - The text message to display in the toast
     * @param type - The type of toast ('success' or 'error') which determines styling
     *
     * @remarks
     * - Animations use native driver for better performance
     * - Previous dismiss timers are cleared when new toasts are shown
     * - Toast content and style are updated when opacity reaches zero
     * - Slide animation is subtle (50px) while opacity does most of the visual work
     */
    const showToast = useCallback(
        (message: string, type: ToastType) => {
            // Clear any existing dismiss timer
            if (dismissTimeoutRef.current) {
                clearTimeout(dismissTimeoutRef.current);
                dismissTimeoutRef.current = null;
            }

            const newToast: ToastMessage = {
                message,
                type,
            };

            if (isToastVisibleRef.current) {
                // If a toast is currently visible, fade out with subtle slide, update content, then fade back in
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0, // Fade out
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 50, // Subtle slide down
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    // Update the toast content while it's invisible (opacity = 0)
                    setCurrentToast(newToast);
                    // Fade back in with slide up
                    Animated.parallel([
                        Animated.timing(opacity, {
                            toValue: 1, // Fade in
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateY, {
                            toValue: 0, // Slide to final position
                            duration: 200,
                            useNativeDriver: true,
                        }),
                    ]).start();
                });
            } else {
                // No toast currently visible, just show the new one
                setCurrentToast(newToast);
                isToastVisibleRef.current = true;
                // Fade in with slide up animation
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 1, // Fade in
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 0, // Slide to final position
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start();
            }

            // Auto dismiss after 5 seconds
            dismissTimeoutRef.current = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0, // Fade out
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: 50, // Subtle slide down
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setCurrentToast(null);
                    isToastVisibleRef.current = false;
                });
            }, 5000);
        },
        [translateY, opacity]
    );

    /**
     * Displays a success toast notification with a green background.
     *
     * This method is a convenience wrapper around showToast() specifically for success messages.
     * The toast will appear near the bottom of the screen with 16px margins, a green background color,
     * and white text, automatically dismissing after 5 seconds with fade and slide animations.
     *
     * @param message - The success message to display to the user
     *
     * @example
     * ```tsx
     * const { success } = useToast();
     * success('Profile updated successfully!');
     * ```
     */
    const success = useCallback(
        (message: string) => {
            showToast(message, 'success');
        },
        [showToast]
    );

    /**
     * Displays an error toast notification with a red background.
     *
     * This method is a convenience wrapper around showToast() specifically for error messages.
     * The toast will appear near the bottom of the screen with 16px margins, a red background color,
     * and white text, automatically dismissing after 5 seconds with fade and slide animations.
     *
     * @param message - The error message to display to the user
     *
     * @example
     * ```tsx
     * const { error } = useToast();
     * error('Failed to save changes. Please try again.');
     * ```
     */
    const error = useCallback(
        (message: string) => {
            showToast(message, 'error');
        },
        [showToast]
    );

    /**
     * Immediately hides the currently visible toast notification.
     *
     * This method clears any pending dismiss timers and animates the toast out of view
     * with a fade and slide animation. After the animation completes, it cleans up
     * the toast state.
     *
     * @example
     * ```tsx
     * const { hide } = useToast();
     * hide(); // Immediately dismiss current toast
     * ```
     */
    const hide = useCallback(() => {
        if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = null;
        }

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 50,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentToast(null);
            isToastVisibleRef.current = false;
        });
    }, [translateY, opacity]);

    const contextValue: ToastContextType = {
        success,
        error,
        hide,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Portal>
                <View style={styles.container} pointerEvents='none'>
                    {currentToast && <Toast toast={currentToast} translateY={translateY} opacity={opacity} />}
                </View>
            </Portal>
        </ToastContext.Provider>
    );
}

type ToastProps = {
    toast: ToastMessage;
    translateY: Animated.Value;
    opacity: Animated.Value;
};

function Toast({ toast, translateY, opacity }: ToastProps) {
    const toastStyle = toast.type === 'success' ? styles.successToast : styles.errorToast;

    return (
        <Animated.View
            style={[
                styles.toast,
                toastStyle,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
    );
}

/**
 * A React hook that provides access to the toast context.
 *
 * @returns The toast context containing methods and state for managing toast notifications
 * @throws {Error} When used outside of a ToastProvider component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast } = useToast();
 *
 *   const handleClick = () => {
 *     showToast('Success!', 'success');
 *   };
 *
 *   return <button onClick={handleClick}>Show Toast</button>;
 * }
 * ```
 */
export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (context === undefined) throw new Error('useToast must be used within a ToastProvider');
    return context;
}

import { PropsWithChildren } from 'react';
import { TouchableOpacity } from 'react-native';
import style from './style';

export type ButtonProps = PropsWithChildren & {
    onPress?: () => void;
    isDisabled?: boolean;
};

export function PrimaryButton({ children, onPress, isDisabled }: ButtonProps) {
    return (
        <TouchableOpacity activeOpacity={0.7} disabled={isDisabled} onPress={onPress} style={[style.button, style.primaryButton]}>
            {children}
        </TouchableOpacity>
    );
}

export function SecondaryButton({ children, onPress, isDisabled }: ButtonProps) {
    return (
        <TouchableOpacity activeOpacity={0.7} disabled={isDisabled} onPress={onPress} style={[style.button, style.secondaryButton]}>
            {children}
        </TouchableOpacity>
    );
}

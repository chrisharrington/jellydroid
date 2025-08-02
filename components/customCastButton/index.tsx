import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { CastState } from 'react-native-google-cast';
import { useCustomCastButton } from './hook';

export type CustomCastButtonProps = {
    style?: any;
    tintColor?: string;
    size?: number;
    onPress?: () => void;
};

export function CustomCastButton({ style, tintColor = 'white', size = 24, onPress }: CustomCastButtonProps) {
    const { state } = useCustomCastButton();

    return (
        <TouchableOpacity
            style={[
                {
                    width: 48,
                    height: 48,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {state === CastState.CONNECTING || state === CastState.CONNECTED ? (
                <MaterialIcons name='cast-connected' size={size} color={tintColor} />
            ) : (
                <MaterialIcons name='cast' size={size} color={tintColor} />
            )}
        </TouchableOpacity>
    );
}

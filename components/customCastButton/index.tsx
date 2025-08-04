import { MaterialIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useCustomCastButton } from './hook';

export type CustomCastButtonProps = {
    style?: any;
    tintColor?: string;
    size?: number;
    onPress?: () => void;
};

export function CustomCastButton({ style, tintColor = 'white', size = 24, onPress }: CustomCastButtonProps) {
    const { isConnected } = useCustomCastButton();

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
            <MaterialIcons name={isConnected ? 'cast-connected' : 'cast'} size={size} color={tintColor} />
        </TouchableOpacity>
    );
}

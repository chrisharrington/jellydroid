import { CustomCastButton } from '@/components/customCastButton';
import { Colours } from '@/constants/colours';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Text, TouchableOpacity, View } from 'react-native';
import style from './style';

export type CustomHeaderProps = {
    isTranslucent?: boolean;
    withBackButton?: boolean;
    withCastButton?: boolean;
    withCastBadge?: boolean;
    castBadgeText?: string;
};

export function CustomHeader(props: CustomHeaderProps) {
    const navigation = useNavigation();

    return (
        <View style={style.container}>
            {props.withBackButton && (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[
                        style.iconContainer,
                        { backgroundColor: props.isTranslucent ? 'rgba(0,0,0,0.2)' : 'transparent' },
                    ]}
                >
                    <Ionicons name='arrow-back' size={24} color='white' />
                </TouchableOpacity>
            )}

            {props.withCastBadge && (
                <View style={style.castBadge}>
                    <View style={style.castBadgeContent}>
                        <MaterialIcons name='cast' size={16} color={Colours.text} />
                        <Text style={style.castText}>{props.castBadgeText || 'Casting to TV'}</Text>
                    </View>
                </View>
            )}

            {props.withCastButton && (
                <View
                    style={[
                        style.iconContainer,
                        { right: 8, left: undefined },
                        { backgroundColor: props.isTranslucent ? 'rgba(0,0,0,0.2)' : 'transparent' },
                    ]}
                >
                    <CustomCastButton style={{ width: 24, height: 24 }} />
                </View>
            )}
        </View>
    );
}

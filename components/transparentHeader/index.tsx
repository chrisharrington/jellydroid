import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, View } from 'react-native';
import { CastButton } from 'react-native-google-cast';
import style from './style';

export function TransparentHeader() {
    const navigation = useNavigation();

    return (
        <View style={style.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={style.iconContainer}>
                <Ionicons name='arrow-back' size={24} color='white' />
            </TouchableOpacity>

            <View style={[style.iconContainer, { right: 8, left: undefined }]}>
                <CastButton style={{ width: 24, height: 24, tintColor: 'white' }} />
            </View>
        </View>
    );
}

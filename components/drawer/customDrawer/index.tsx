import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colours } from '@/constants/colours';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { CustomDrawerItem } from './customDrawerItem';
import styles from './style';

export function CustomDrawer(props: any) {
    const router = useRouter();

    return (
        <DrawerContentScrollView {...props} style={styles.container}>
            <View style={styles.content}>
                <CustomDrawerItem
                    label='Home'
                    path='(drawer)/(home)'
                    icon={() => <IconSymbol size={24} name='house' color={Colours.icon} />}
                />
            </View>
        </DrawerContentScrollView>
    );
}

import { Drawer } from 'expo-router/drawer';
import { Colours } from '@/constants/colours';
import { CustomDrawer } from '@/components/drawer/customDrawer';

export default function DrawerLayout() {
    return (
        <Drawer
            drawerContent={(props) => <CustomDrawer {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colours.background2,
                },
                headerTintColor: Colours.text,
            }}
        >
            <Drawer.Screen
                name='(home)/index'
                options={{
                    title: 'Home',
                }}
            />
        </Drawer>
    );
}

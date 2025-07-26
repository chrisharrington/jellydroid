import { CustomDrawer } from '@/components/drawer/customDrawer';
import { Colours } from '@/constants/colours';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
    return (
        <Drawer
            drawerContent={props => <CustomDrawer {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colours.background2,
                },
                headerTintColor: Colours.text,
            }}
        >
            <Drawer.Screen
                name='index'
                options={{
                    title: 'Home',
                }}
            />
        </Drawer>
    );
}

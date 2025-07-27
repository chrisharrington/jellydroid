import { CustomDrawer } from '@/components/drawer/customDrawer';
import { Colours } from '@/constants/colours';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { CastButton } from 'react-native-google-cast';

export default function DrawerLayout() {
    return (
        <Drawer
            drawerContent={props => <CustomDrawer {...props} />}
            screenOptions={{
                title: '',
                headerStyle: {
                    backgroundColor: Colours.background3,
                },
                headerTintColor: Colours.text,
                headerRight: () => <CastButton style={{ width: 56, height: 56 }} />,
                swipeEnabled: false,
            }}
        >
            <Drawer.Screen name='index' />
        </Drawer>
    );
}

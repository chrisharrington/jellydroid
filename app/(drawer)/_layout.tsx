import { CustomDrawer } from '@/components/drawer/customDrawer';
import { Colours } from '@/constants/colours';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { CastButton } from 'react-native-google-cast';

export default function DrawerLayout() {
    const defaultScreenOptions = {
        title: '',
        headerTintColor: Colours.text,
        headerRight: () => <CastButton style={{ width: 56, height: 56 }} />,
        swipeEnabled: false,
        headerStyle: {
            backgroundColor: Colours.background,
        },
    };

    return (
        <>
            <Drawer drawerContent={props => <CustomDrawer {...props} />} screenOptions={defaultScreenOptions}>
                <Drawer.Screen name='index' />
                <Drawer.Screen
                    name='movie/[name]/[id]'
                    options={{
                        ...defaultScreenOptions,
                        headerTransparent: true,
                        headerStyle: {
                            backgroundColor: 'transparent',
                        },
                    }}
                />
            </Drawer>
        </>
    );
}

import 'react-native-url-polyfill/auto';
import 'expo-dev-client';
import { Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Jellyfin } from '../data/jellyfin';
import { JellyfinContext } from '../data/jellyfin/context';

export default function RootLayout() {
    const jellyfin = useRef<Jellyfin>(new Jellyfin());

    return <JellyfinContext.Provider value={jellyfin.current}>
        <Slot />
    </JellyfinContext.Provider>;
}
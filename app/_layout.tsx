import 'react-native-url-polyfill/auto';
import 'expo-dev-client';
import { Slot } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Jellyfin } from '../data/jellyfin';

export default function RootLayout() {
    const jellyfin = useRef<Jellyfin>(new Jellyfin());

    useEffect(() => {
        jellyfin.current.init();
    });

    return <Slot />;
}
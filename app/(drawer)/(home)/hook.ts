import { useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export function useHome() {
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Home',
        });
    }, [navigation]);
}

export default {}
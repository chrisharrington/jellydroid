import { useCastState, useDevices } from 'react-native-google-cast';

export function useCustomCastButton() {
    const castState = useCastState(),
        devices = useDevices();

    return {
        state: castState,
    };
}

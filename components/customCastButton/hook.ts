import { useCastState } from 'react-native-google-cast';

export function useCustomCastButton() {
    const castState = useCastState();

    return {
        state: castState,
    };
}

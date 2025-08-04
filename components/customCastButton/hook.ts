import { CastState, useCastState, useRemoteMediaClient } from 'react-native-google-cast';

export function useCustomCastButton() {
    const castState = useCastState(),
        client = useRemoteMediaClient();

    return {
        isConnected: client && (castState === CastState.CONNECTED || castState === CastState.CONNECTING),
    };
}

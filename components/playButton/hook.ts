import { useCast } from '@/contexts/cast';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useRemoteMediaClient } from 'react-native-google-cast';
import { PlayButtonProps } from '.';
import { useToast } from '../toast';

export function usePlayButton(props: PlayButtonProps) {
    const { push } = useRouter(),
        { cast } = useCast(),
        client = useRemoteMediaClient(),
        toast = useToast();

    const onPress = async () => {
        try {
            if (!props.item || !props.item.MediaSources?.[0]) throw new Error('Item or media source not found.');

            // Navigate to the remote control screen if connected to a cast device.
            if (client) {
                // Navigate the user to the remote control screen.
                push(`/remote/${props.item.Id}/${props.item.MediaSources?.[0].Id}`);

                // Cast the item to the remote media client.
                cast(props.item, true);

                return;
            } else {
                push(`/video/${props.item.Id}/${props.item.MediaSources?.[0].Id}`);
            }
        } catch (e) {
            toast.error('Unable to play media. Please try again later.');
        }
    };

    return {
        isResumable: useMemo(() => (props.item.UserData?.PlaybackPositionTicks || 0) > 0, [props.item]),
        onPress,
    };
}

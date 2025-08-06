import { useCast } from '@/contexts/cast';
import { useRouter } from 'expo-router';
import { useRemoteMediaClient } from 'react-native-google-cast';
import { PlayButtonProps } from '.';

export function usePlayButton(props: PlayButtonProps) {
    const { push } = useRouter(),
        { cast } = useCast(),
        client = useRemoteMediaClient();

    return { handlePress };

    async function handlePress() {
        // Navigate to the remote control screen if connected to a cast device.
        if (client) {
            push(`/remote/${props.item.Id}/${props.item.MediaSources?.[0].Id}`);

            if (!props.item || !props.item.MediaSources?.[0]) throw new Error('Item or media source not found.');

            // Cast the item to the remote media client.
            cast(props.item);

            return;
        }
    }
}

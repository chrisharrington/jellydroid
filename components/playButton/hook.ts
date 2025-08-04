import { useRouter } from 'expo-router';
import { PlayButtonProps } from '.';

export function usePlayButton(props: PlayButtonProps) {
    const { push } = useRouter();

    return { handlePress };

    function handlePress() {
        // Navigate to the remote control screen.
        push(`/remote/${props.item.Id}/${props.item.MediaSources?.[0].Id}`);
    }
}

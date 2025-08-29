import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useCallback, useState } from 'react';
import { TogglePlayedButtonProps } from '.';

export function useTogglePlayedButton(props: TogglePlayedButtonProps) {
    const [isToggling, setToggling] = useState<boolean>(false),
        [isPlayed, setPlayed] = useState<boolean>(props.item.UserData?.Played || false),
        { updateItem } = useJellyfin(),
        toast = useToast();

    /**
     * Toggles the played status of the provided item and displays a success toast.
     * If the item has any playback progress, it will be marked as played.
     * @throws {Error} If the toggle operation fails
     * @returns {Promise<void>}
     */
    const handleTogglePlayed = useCallback(async () => {
        if (!props.item || isToggling) return;

        try {
            setToggling(true);

            // Make the API call to Jellyfin to update the provided item.
            updateItem(props.item.Id!, {
                ...props.item,
                UserData: {
                    ...props.item.UserData,
                    PlaybackPositionTicks: isPlayed ? 0 : props.item.UserData?.PlaybackPositionTicks,
                    Played: !isPlayed,
                },
            });

            // Indicate to the user that the Jellyfin call completed successfully.
            toast.success(`${props.item.Name} has been marked as ${!isPlayed ? 'played' : 'unplayed'}.`);

            // Flip the played state variable.
            setPlayed(!isPlayed);

            // Call the optional callback if provided.
            if (props.onToggleComplete) props.onToggleComplete();
        } catch (error) {
            toast.error('Failed to update played status. Please try again.', error);
        } finally {
            setToggling(false);
        }
    }, [props.item, props.onToggleComplete, toast, isToggling]);

    return {
        isToggling,
        isPlayed: isPlayed,
        handleTogglePlayed,
    };
}

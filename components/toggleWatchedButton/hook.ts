import { useToast } from '@/components/toast';
import { useJellyfin } from '@/hooks/jellyfin';
import { useCallback, useState } from 'react';
import { ToggleWatchedButtonProps } from '.';

export function useToggleWatchedButton(props: ToggleWatchedButtonProps) {
    const [isToggling, setToggling] = useState<boolean>(false),
        { toggleItemWatched } = useJellyfin(),
        toast = useToast();

    /**
     * Toggles the watched status of the provided item and displays a success toast.
     * If the item has any playback progress, it will be marked as watched.
     * @throws {Error} If the toggle operation fails
     * @returns {Promise<void>}
     */
    const handleToggleWatched = useCallback(async () => {
        if (!props.item || isToggling) return;

        try {
            setToggling(true);

            // Derive whether the item is currently watched or unwatched.
            const isWatched = (props.item.UserData?.PlaybackPositionTicks || 0) > 0;

            // Make the API call to Jellyfin to update the provided item.
            await toggleItemWatched(props.item, !isWatched);

            // Indicate to the user that the Jellyfin call completed successfully.
            toast.success(`${props.item.Name} has been marked as ${!isWatched ? 'watched' : 'unwatched'}.`);

            // Call the optional callback if provided.
            if (props.onToggleComplete) props.onToggleComplete();
        } catch (error) {
            toast.error('Failed to update watched status. Please try again.', error);
        } finally {
            setToggling(false);
        }
    }, [props.item, props.onToggleComplete, toggleItemWatched, toast, isToggling]);

    return {
        isToggling,
        handleToggleWatched,
    };
}

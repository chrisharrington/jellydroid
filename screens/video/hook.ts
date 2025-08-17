import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer } from 'expo-video';
import { useEffect, useState } from 'react';

export function useVideoScreen() {
    const params = useLocalSearchParams<{ itemId: string; mediaSourceId: string }>(),
        [isBusy, setBusy] = useState<boolean>(false),
        { getItemDetails, getStreamUrl, getResumePositionSeconds } = useJellyfin(),
        [item, setItem] = useState<BaseItemDto | null>(null),
        player = useVideoPlayer(item ? getStreamUrl(item) : null, player => {
            player.play();
        });

    // Handle resume position when video is ready
    useEffect(() => {
        if (!player || !item) return;

        const resumeSeconds = getResumePositionSeconds(item);
        if (resumeSeconds <= 0) return;

        // Add a status listener that seeks to the resume position when the video is ready to play.
        const statusListener = player.addListener('statusChange', event => {
            if (event.status !== 'readyToPlay') return;

            player.currentTime = resumeSeconds;
            statusListener.remove();
        });

        return () => statusListener?.remove();
    }, [player, item, getResumePositionSeconds]);

    useEffect(() => {
        // Lock screen to landscape orientation when component mounts.
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);

        // Cleanup: restore to default orientation when component unmounts.
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Ensure the client is available before proceeding.
            const item = await getItemDetails(params.itemId);
            if (!item) throw new Error('Item not found.');

            // Set the item for the current playback.
            setItem(item);
        } catch (e) {
            console.error('Error retrieving item details:', e);
        } finally {
            setBusy(false);
        }
    }, []);

    return {
        player,
        isBusy,
    };
}

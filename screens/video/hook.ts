import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import * as NavigationBar from 'expo-navigation-bar';
import { useGlobalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';

export function useVideoScreen() {
    const params = useGlobalSearchParams<{ itemId: string; mediaSourceId: string; subtitleIndex?: string }>(),
        [isBusy, setBusy] = useState<boolean>(false),
        [streamUrl, setStreamUrl] = useState<string | null>(null),
        { loadItem, getStreamUrlFromItemId, getResumePositionSeconds } = useJellyfin(),
        [item, setItem] = useState<BaseItemDto | null>(null),
        subtitleIndex = useMemo(
            () => (params.subtitleIndex ? parseInt(params.subtitleIndex) : undefined),
            [params.subtitleIndex]
        ),
        player = useVideoPlayer(streamUrl, player => {
            player.play();
        }),
        toast = useToast();

    // Handle resume position when video is ready and item is loaded.
    useEffect(() => {
        if (!player || !item) return;

        // Retrieve the resume position in seconds, if available.
        const resumeSeconds = getResumePositionSeconds(item);
        if (resumeSeconds <= 0) return;

        // Add a status listener that seeks to the resume position when the video is ready to play.
        const resumeListener = player.addListener('statusChange', event => {
            if (event.status !== 'readyToPlay') return;

            player.currentTime = resumeSeconds;
            resumeListener.remove();
        });

        return () => {
            resumeListener?.remove();
        };
    }, [player, item, getResumePositionSeconds]);

    useEffect(() => {
        // Lock screen to landscape orientation when component mounts.
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);

        // Hide the navigation bar.
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');

        // Cleanup: restore to default orientation when component unmounts.
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Retrieve item details and media info.
            const [item, streamUrl] = await Promise.all([
                loadItem(params.itemId),
                getStreamUrlFromItemId(params.itemId, subtitleIndex),
            ]);

            // Throw an error if either the item or streamUrl are missing.
            if (!item) throw new Error('Item not found.');
            if (!streamUrl) throw new Error('Stream URL not found.');

            // Set the item for the current playback.
            setItem(item);

            // Set the stream URL for the video player.
            setStreamUrl(streamUrl);
        } catch (e) {
            toast.error('Error retrieving item details.', e);
        } finally {
            setBusy(false);
        }
    }, []);

    return {
        player,
        item,
        isBusy,
    };
}

import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import * as Crypto from 'expo-crypto';
import * as NavigationBar from 'expo-navigation-bar';
import { useGlobalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { AppState, BackHandler } from 'react-native';

export function useVideoScreen() {
    const params = useGlobalSearchParams<{ itemId: string; mediaSourceId: string; subtitleIndex?: string }>(),
        [isBusy, setBusy] = useState<boolean>(false),
        [streamUrl, setStreamUrl] = useState<string | null>(null),
        { getItem, startPlaybackSession, stopPlaybackSession, getStreamUrlFromItemId, getResumePositionSeconds } =
            useJellyfin(),
        [item, setItem] = useState<BaseItemDto | null>(null),
        subtitleIndex = useMemo(
            () => (params.subtitleIndex ? parseInt(params.subtitleIndex) : undefined),
            [params.subtitleIndex]
        ),
        player = useVideoPlayer(streamUrl, player => {
            player.play();
        }),
        [playbackSessionId, setPlaybackSessionId] = useState<string | null>(null),
        toast = useToast();

    // Handle resume position when video is ready and item is loaded.
    useAsyncEffect(async () => {
        if (!player || !item) return;

        // Generate a new playback session ID when playback commences.
        setPlaybackSessionId(Crypto.randomUUID());

        // Start a playback session.
        await startPlaybackSession(item.Id!, item.MediaSources?.[0].Id!, playbackSessionId);

        // Handle hardware back navigation.
        const backSubscription = BackHandler.addEventListener('hardwareBackPress', () => handleBackPress());

        // Handle app state changes (minimized, closed, etc.).
        const appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') handleAppMinimized();
        });

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
            resumeListener.remove();
            backSubscription.remove();
            appStateSubscription?.remove();
        };
    }, [player, item]);

    useEffect(() => {
        // Lock screen to landscape orientation when component mounts.
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);

        // Hide the navigation bar.
        NavigationBar.setVisibilityAsync('hidden');

        // Cleanup: restore to default orientation when component unmounts.
        return () => {
            ScreenOrientation.unlockAsync();
        };
    }, []);

    /**
     * Handles the back navigation event.
     * Can be used to perform cleanup, save state, or prevent navigation.
     * @returns {boolean} true to prevent default back action, false to allow it
     */
    function handleBackPress(): boolean {
        if (item) {
            // Stop the playback session for the current item.
            stopPlaybackSession(item.Id!, item.MediaSources?.[0].Id!, playbackSessionId, player.currentTime);
        }

        // Return false to allow the default back navigation to proceed.
        return false;
    }

    /**
     * Handles when the app is minimized or goes to background.
     * Performs cleanup tasks like stopping playback session.
     */
    function handleAppMinimized(): void {
        if (!item || !playbackSessionId) return;

        // Stop the playback session and save current position.
        stopPlaybackSession(item.Id!, item.MediaSources?.[0].Id!, playbackSessionId, player.currentTime);
    }

    useAsyncEffect(async () => {
        try {
            // Initialize the remote media client and fetch item details.
            setBusy(true);

            // Retrieve item details and media info.
            const [item, streamUrl] = await Promise.all([
                getItem(params.itemId),
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
        playbackSessionId,
        isBusy,
        handleBackPress,
        handleAppMinimized,
    };
}

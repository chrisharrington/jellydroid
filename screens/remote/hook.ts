import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useJellyfin } from '@/hooks/useJellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useRemoteMediaClient } from 'react-native-google-cast';

type SubtitleOption = {
    label: string;
    value: string;
};

type AudioOption = {
    label: string;
    value: string;
};

type PlayStatus = {
    isPlaying: boolean;
    streamPosition: number;
    maxPosition: number;
    currentTime: string;
    maxTime: string;
};

export function useRemoteScreen() {
    const client = useRemoteMediaClient(),
        { getItemDetails, getPosterForItem } = useJellyfin(),
        [isBusy, setBusy] = useState<boolean>(false),
        [item, setItem] = useState<BaseItemDto | null>(null),
        [poster, setPoster] = useState<string | null>(null),
        [selectedSubtitle, setSelectedSubtitle] = useState<string>('none'),
        [selectedAudio, setSelectedAudio] = useState<string>('en'),
        params = useLocalSearchParams<{ id: string }>();

    const subtitleOptions: SubtitleOption[] = [
        { label: 'None', value: 'none' },
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Japanese', value: 'ja' },
    ];

    const audioOptions: AudioOption[] = [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
        { label: 'French', value: 'fr' },
        { label: 'German', value: 'de' },
        { label: 'Italian', value: 'it' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Japanese', value: 'ja' },
        { label: 'Russian', value: 'ru' },
    ];

    useAsyncEffect(async () => {
        if (!params.id) return;

        try {
            setBusy(true);
            const item = await getItemDetails(params.id);
            if (!item) throw new Error('Item not found.');

            setItem(item);
            setPoster(getPosterForItem(item));
        } catch (e) {
            console.error('Failed to initialize remote media client:', e);
        } finally {
            setBusy(false);
        }
    }, []);

    /**
     * Pauses the current client operation asynchronously.
     *
     * This function attempts to call the `pause` method on the `client` object if it exists.
     * If the operation fails, an error is logged to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the pause operation completes.
     * @throws Logs an error to the console if the pause operation fails.
     * @dependency Depends on the `client` object.
     */
    const pause = useCallback(async () => {
        try {
            if (!client) return;
            await client.pause();
        } catch (error) {
            console.error('Failed to pause:', error);
        }
    }, [client]);

    /**
     * Attempts to resume playback by invoking the `play` method on the provided `client`.
     * If the `client` is not available, the function exits early.
     * Any errors encountered during the operation are caught and logged to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the playback has been resumed or an error has been handled.
     * @throws Will not throw, but logs errors to the console.
     */
    const resume = useCallback(async () => {
        try {
            if (!client) return;
            await client.play();
        } catch (error) {
            console.error('Failed to resume:', error);
        }
    }, [client]);

    /**
     * Seeks the media playback forward by a specified number of seconds.
     *
     * @param seconds - The number of seconds to seek forward. Defaults to 30 seconds if not provided.
     * @returns A promise that resolves when the seek operation is complete.
     *
     * @remarks
     * - If the `client` is not available or the media status cannot be retrieved, the function exits early.
     * - Logs an error to the console if the seek operation fails.
     */
    const seekForward = useCallback(
        async (seconds: number = 30) => {
            try {
                if (!client) return;

                const status = await client.getMediaStatus();
                if (!status) return;

                const newPosition = status.streamPosition + seconds;
                await client.seek({ position: newPosition });
            } catch (error) {
                console.error('Failed to seek forward:', error);
            }
        },
        [client]
    );

    /**
     * Seeks the media playback backward by a specified number of seconds.
     *
     * @param seconds - The number of seconds to seek backward. Defaults to 10 seconds if not provided.
     * @remarks
     * - If the client is not available or the media status cannot be retrieved, the function exits early.
     * - The new playback position will not go below 0 seconds.
     * - Any errors encountered during the seek operation are logged to the console.
     */
    const seekBackward = useCallback(
        async (seconds: number = 10) => {
            try {
                if (!client) return;

                const status = await client.getMediaStatus();
                if (!status) return;

                const newPosition = Math.max(0, status.streamPosition - seconds);
                await client.seek({ position: newPosition });
            } catch (error) {
                console.error('Failed to seek backward:', error);
            }
        },
        [client]
    );

    /**
     * Stops the current client asynchronously.
     *
     * This function attempts to stop the provided `client` instance by calling its `stop` method.
     * If the `client` is not available, the function returns early. Any errors encountered during
     * the stop operation are caught and logged to the console.
     *
     * @returns {Promise<void>} A promise that resolves when the client has been stopped or if no client exists.
     * @throws Logs an error to the console if stopping the client fails.
     */
    const stop = useCallback(async () => {
        try {
            if (!client) return;
            await client.stop();
        } catch (error) {
            console.error('Failed to stop:', error);
        }
    }, [client]);

    /**
     * Changes the subtitle track for the current media playback.
     *
     * @param subtitleValue - The value of the subtitle track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected subtitle state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeSubtitle = useCallback(
        async (subtitleValue: string) => {
            try {
                if (!client) return;

                // TODO: Implement actual subtitle switching logic with Google Cast
                // await client.setActiveTrackIds([subtitleTrackId]);

                setSelectedSubtitle(subtitleValue);
            } catch (error) {
                console.error('Failed to change subtitle:', error);
            }
        },
        [client]
    );

    /**
     * Changes the audio track for the current media playback.
     *
     * @param audioValue - The value of the audio track to switch to.
     * @remarks
     * - If the client is not available, the function exits early.
     * - Updates the selected audio state when successful.
     * - Any errors encountered during the operation are logged to the console.
     */
    const changeAudio = useCallback(
        async (audioValue: string) => {
            try {
                if (!client) return;

                // TODO: Implement actual audio track switching logic with Google Cast
                // await client.setActiveTrackIds([audioTrackId]);

                setSelectedAudio(audioValue);
            } catch (error) {
                console.error('Failed to change audio track:', error);
            }
        },
        [client]
    );

    return {
        pause,
        resume,
        seekForward,
        seekBackward,
        stop,
        changeSubtitle,
        changeAudio,
        item,
        poster,
        selectedSubtitle,
        subtitleOptions,
        selectedAudio,
        audioOptions,
        status: {
            isPlaying: false,
            streamPosition: 0,
            maxPosition: 0,
            currentTime: '00:00',
            maxTime: '2:07:12',
        } as PlayStatus,
        isBusy,
    };
}

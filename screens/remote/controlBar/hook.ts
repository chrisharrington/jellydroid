import { useCast } from '@/contexts/cast';
import { SubtitleMetadata } from '@/contexts/jellyfin/models';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaTrack } from 'react-native-google-cast';
import { ControlBarProps } from '.';

export function useControlBar({ pause, resume, status }: ControlBarProps) {
    const { getSubtitleTrackMetadata, setSubtitleTrack } = useCast(),
        [subtitleTracks, setSubtitleTracks] = useState<(SubtitleMetadata & MediaTrack)[]>([]),
        [isSubtitleTrackEnabled, setSubtitleTrackEnabled] = useState<boolean>(false);

    // Set the subtitle track for the cast session when the user toggles subtitles.
    useEffect(() => {
        setSubtitleTrack(isSubtitleTrackEnabled ? subtitleTracks[0] || null : null);
    }, [isSubtitleTrackEnabled]);

    // Retrieve the subtitle tracks for the currently casting media.
    useAsyncEffect(async () => {
        if (!status.isMediaTrackInfoAvailable) return;

        setSubtitleTracks(await getSubtitleTrackMetadata());
    }, [status.isMediaTrackInfoAvailable]);

    /**
     * Toggles playback between playing and paused states.
     * If currently playing, pauses playback.
     * If currently paused, resumes playback.
     */
    const handlePlayPause = useCallback(() => {
        if (status.isPlaying) pause();
        else resume();
    }, [pause, resume, status.isPlaying]);

    return {
        handlePlayPause,
        handleSubtitleToggle: useCallback(() => setSubtitleTrackEnabled(v => !v), []),
        isSubtitleTrackEnabled,
        isSubtitleTrackAvailable: useMemo(() => subtitleTracks.length > 0, [subtitleTracks]),
        isForcedSubtitleTrackAvailable: useMemo(() => subtitleTracks.some(t => t.isForced), [subtitleTracks]),
    };
}

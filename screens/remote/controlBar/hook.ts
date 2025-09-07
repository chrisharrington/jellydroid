import { useCast } from '@/contexts/cast';
import { SubtitleMetadata } from '@/contexts/jellyfin/models';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useCallback, useMemo, useState } from 'react';
import { MediaTrack } from 'react-native-google-cast';
import { ControlBarProps } from '.';

export type SubtitleType = 'none' | 'all' | 'translate';

export function useControlBar({ pause, resume, status }: ControlBarProps) {
    const { getSubtitleTrackMetadata, setSubtitleTrack, currentSubtitleTrack } = useCast(),
        [subtitleTracks, setSubtitleTracks] = useState<(SubtitleMetadata & MediaTrack)[]>([]),
        [isSubtitleSelectorVisible, setSubtitleSelectorVisible] = useState<boolean>(false),
        [selectedSubtitleName, setSelectedSubtitle] = useState<string | null>(null),
        isSubtitleTrackEnabled = useMemo(() => !!currentSubtitleTrack, [currentSubtitleTrack]),
        isSubtitleTrackAvailable = useMemo(() => subtitleTracks.length > 0, [subtitleTracks]),
        isForcedSubtitleTrackAvailable = useMemo(() => subtitleTracks.some(t => t.isForced), [subtitleTracks]);

    // Retrieve the subtitle tracks for the currently casting media.
    useAsyncEffect(async () => {
        if (!status.isMediaTrackInfoAvailable) return;

        const tracks = await getSubtitleTrackMetadata();
        console.log('Subtitle Tracks:', tracks);
        setSubtitleTracks(tracks);
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

    const handleSubtitleButtonPress = useCallback(() => {
        console.log(
            'isSubtitleTrackAvailable:',
            isSubtitleTrackAvailable,
            'isForcedSubtitleTrackAvailable:',
            isForcedSubtitleTrackAvailable
        );
        if (subtitleTracks.length === 0) return;
        if (currentSubtitleTrack) setSubtitleTrack(null);
        if (isSubtitleTrackAvailable && !isForcedSubtitleTrackAvailable) setSubtitleTrack(subtitleTracks[0]);
        if (isSubtitleTrackAvailable && isForcedSubtitleTrackAvailable) setSubtitleSelectorVisible(true);
    }, [subtitleTracks]);

    const handleSubtitleSelection = useCallback((selectedSubtitle: string | null) => {
        setSubtitleSelectorVisible(false);
        setSelectedSubtitle(selectedSubtitle);
        setSubtitleTrack(
            selectedSubtitle === null
                ? null
                : selectedSubtitle === 'all'
                ? subtitleTracks.find(t => !t.isForced) || null
                : subtitleTracks.find(t => t.isForced) || null
        );
    }, []);

    return {
        handlePlayPause,
        handleSubtitleButtonPress,
        handleSubtitleSelection,
        isSubtitleTrackEnabled,
        isSubtitleTrackAvailable,
        isForcedSubtitleTrackAvailable,
        isSubtitleSelectorVisible,
        setSubtitleSelectorVisible,
        setSelectedSubtitle,
        selectedSubtitleName,
    };
}

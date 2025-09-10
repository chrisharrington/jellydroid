import { useCast } from '@/contexts/cast';
import { SubtitleMetadata } from '@/contexts/jellyfin/models';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useMemo, useState } from 'react';
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
        setSubtitleTracks(await getSubtitleTrackMetadata());
    }, [status.isMediaTrackInfoAvailable]);

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

    /**
     * Toggles playback between playing and paused states.
     * If currently playing, pauses playback.
     * If currently paused, resumes playback.
     */
    function handlePlayPause() {
        if (status.isPlaying) pause();
        else resume();
    }

    /**
     * Handles the subtitle button press event in the control bar.
     * If no subtitle tracks are available, the function returns early.
     * If a subtitle track is currently active, it will be disabled.
     * For non-forced subtitle tracks, automatically selects the first available track.
     * For forced subtitle tracks, displays the subtitle selector.
     *
     * @returns {void}
     */
    function handleSubtitleButtonPress() {
        if (subtitleTracks.length === 0) return;
        if (currentSubtitleTrack) setSubtitleTrack(null);
        if (isSubtitleTrackAvailable && !isForcedSubtitleTrackAvailable) setSubtitleTrack(subtitleTracks[0]);
        if (isSubtitleTrackAvailable && isForcedSubtitleTrackAvailable) setSubtitleSelectorVisible(true);
    }

    /**
     * Handles the selection of subtitles and updates related state.
     * @param selectedSubtitle - The subtitle option selected by the user. Can be a string identifier or null to disable subtitles.
     *                          Use 'all' to select non-forced subtitles, any other string value will select forced subtitles.
     */
    function handleSubtitleSelection(selectedSubtitle: string | null) {
        setSubtitleSelectorVisible(false);
        setSelectedSubtitle(selectedSubtitle);
        setSubtitleTrack(
            selectedSubtitle === null
                ? null
                : selectedSubtitle === 'all'
                ? subtitleTracks.find(t => !t.isForced) || null
                : subtitleTracks.find(t => t.isForced) || null
        );
    }
}

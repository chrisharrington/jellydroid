import { useAsyncEffect } from '@/hooks/useAsyncEffect';
import { useJellyfin } from '@/hooks/useJellyfin';
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useRemoteMediaClient } from 'react-native-google-cast';
import { PlayButtonProps } from '.';

export function usePlayButton(props: PlayButtonProps) {
    const { getMediaInfo } = useJellyfin(),
        [mediaInfo, setMediaInfo] = useState<PlaybackInfoResponse | null>(null),
        client = useRemoteMediaClient(),
        { push } = useRouter();

    useAsyncEffect(async () => {
        if (!props.item.Id) return;

        setMediaInfo(await getMediaInfo(props.item.Id));
    }, [props.item]);

    return { handlePress };

    function handlePress() {
        if (!client || !mediaInfo || !mediaInfo.MediaSources?.length) return;

        const streamUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Videos/${props.item.Id}/master.m3u8?MediaSourceId=${mediaInfo.MediaSources[0].Id}&VideoCodec=h264&AudioCodec=aac,mp3&VideoBitrate=15808283&AudioBitrate=384000&MaxFramerate=23.976025&MaxWidth=1024&api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}&TranscodingMaxAudioChannels=2&RequireAvc=false&EnableAudioVbrEncoding=true&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=False&hevc-level=150&hevc-videobitdepth=10&hevc-profile=main10&h264-profile=high,main,baseline,constrainedbaseline&h264-level=41&aac-audiochannels=2&TranscodeReasons=ContainerNotSupported,%20VideoCodecNotSupported,%20AudioCodecNotSupported`,
            posterUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${props.item.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`;

        client.loadMedia({
            autoplay: true,
            mediaInfo: {
                contentUrl: streamUrl,
                contentType: 'video/mp4',
                metadata: {
                    type: 'movie',
                    title: props.item.Name || 'Unknown Movie',
                    images: [{ url: posterUrl }],
                },
            },
        });

        push(`/remote/${props.item.Id}`);
    }
}

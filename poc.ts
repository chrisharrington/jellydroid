// import { Tabs } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import { Platform, View } from 'react-native';
// import GoogleCast, { CastButton, useCastSession, useCastState, useRemoteMediaClient } from 'react-native-google-cast';
// import { HapticTab } from '@/components/HapticTab';
// import { IconSymbol } from '@/components/ui/iconSymbol';
// import TabBarBackground from '@/components/ui/TabBarBackground';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';
// import { useJellyfin } from '@/hooks/useJellyfin';
// import { useAsyncEffect } from '@/hooks/useAsyncEffect';
// import { MediaSourceType } from '@jellyfin/sdk/lib/generated-client/models';

// const [streamUrl, setStreamUrl] = useState<string | null>(null),
//     [posterUrl, setPosterUrl] = useState<string | null>(null),
//     { findMovieByName, getMediaInfo } = useJellyfin(),
//     castState = useCastState(),
//     client = useRemoteMediaClient();

// useAsyncEffect(async () => {
//     const movie = await findMovieByName('Game Night');
//     if (!movie) throw new Error('Movie not found.');
//     if (!movie.Id) throw new Error('Movie ID is missing.');

//     const mediaInfo = await getMediaInfo(movie.Id);
//     if (!mediaInfo.MediaSources || mediaInfo.MediaSources.length === 0) throw new Error('No media sources found for the movie.');

//     const streamUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/videos/${movie.Id}/master.m3u8?MediaSourceId=${mediaInfo.MediaSources[0].Id}&VideoCodec=h264&AudioCodec=aac,mp3&AudioStreamIndex=1&VideoBitrate=15808283&AudioBitrate=384000&MaxFramerate=23.976025&MaxWidth=1024&api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}&SubtitleMethod=Encode&TranscodingMaxAudioChannels=2&RequireAvc=false&EnableAudioVbrEncoding=true&SegmentContainer=ts&MinSegments=1&BreakOnNonKeyFrames=False&hevc-level=150&hevc-videobitdepth=10&hevc-profile=main10&h264-profile=high,main,baseline,constrainedbaseline&h264-level=41&aac-audiochannels=2&TranscodeReasons=ContainerNotSupported,%20VideoCodecNotSupported,%20AudioCodecNotSupported`,
//         posterUrl = `${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${movie.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`;

//     console.log('Stream URL:', streamUrl);
//     console.log('Poster URL:', posterUrl);
//     console.log('Movie:', movie.Name);

//     setStreamUrl(streamUrl);
//     setPosterUrl(posterUrl);
// }, []);

// useEffect(() => {
//     console.log('Client:', client);
//     console.log('Cast State:', castState);

//     if (!client || !streamUrl || !posterUrl) return;

//     console.log('Casting...');

//     client.loadMedia({
//         autoplay: true,
//         mediaInfo: {
//             contentUrl: streamUrl,
//             contentType: 'video/mp4',
//             metadata: {
//                 type: 'movie',
//                 title: 'Unknown Movie',
//                 images: [{ url: posterUrl }],
//             },
//         }
//     });
// }, [client, castState, streamUrl, posterUrl]);

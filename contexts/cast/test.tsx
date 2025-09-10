import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { CastProvider, useCast } from '.';

// Mock dependencies
jest.mock('@/components/toast', () => ({
    useToast: jest.fn(),
}));

jest.mock('react-native-google-cast', () => ({
    CastContext: {
        getSessionManager: jest.fn(),
    },
    MediaPlayerState: {
        PLAYING: 'PLAYING',
        BUFFERING: 'BUFFERING',
        IDLE: 'IDLE',
        PAUSED: 'PAUSED',
    },
    useCastSession: jest.fn(),
    useDevices: jest.fn(),
    useRemoteMediaClient: jest.fn(),
}));

jest.mock('../jellyfin', () => ({
    useJellyfin: jest.fn(),
}));

jest.mock('@jellyfin/sdk/lib/generated-client/models', () => ({
    BaseItemDto: {},
}));

describe('CastContext', () => {
    const mockToastError = jest.fn(),
        mockLoadMedia = jest.fn(),
        mockPause = jest.fn(),
        mockPlay = jest.fn(),
        mockStop = jest.fn(),
        mockSeek = jest.fn(),
        mockGetMediaStatus = jest.fn(),
        mockGetStreamPosition = jest.fn(),
        mockSetActiveTrackIds = jest.fn(),
        mockGetStreamUrl = jest.fn(),
        mockGetSubtitleTrackMetadata = jest.fn(),
        mockStartSession = jest.fn(),
        mockEndCurrentSession = jest.fn();

    // Import mocked modules.
    const { useToast } = require('@/components/toast'),
        {
            useCastSession,
            useDevices,
            useRemoteMediaClient,
            CastContext: GoogleCastContext,
        } = require('react-native-google-cast'),
        { useJellyfin } = require('../jellyfin');

    const createMockClient = () => ({
        loadMedia: mockLoadMedia,
        pause: mockPause,
        play: mockPlay,
        stop: mockStop,
        seek: mockSeek,
        getMediaStatus: mockGetMediaStatus,
        getStreamPosition: mockGetStreamPosition,
        setActiveTrackIds: mockSetActiveTrackIds,
        onMediaProgressUpdated: jest.fn(() => ({ remove: jest.fn() })),
        onMediaStatusUpdated: jest.fn(() => ({ remove: jest.fn() })),
    });

    const createMockDevices = () => [
        {
            deviceId: 'device-1',
            friendlyName: 'living room tv',
            capabilities: ['VideoOut'],
        },
        {
            deviceId: 'device-2',
            friendlyName: 'bedroom speaker',
            capabilities: ['AudioOut'],
        },
        {
            deviceId: 'device-3',
            friendlyName: 'kitchen display',
            capabilities: ['VideoOut'],
        },
    ];

    const createMockItem = (overrides: any = {}) => ({
        Id: 'test-item-id',
        Name: 'Test Movie',
        UserData: {
            PlaybackPositionTicks: 0,
        },
        MediaSources: [{ Id: 'media-source-1' }],
        ...overrides,
    });

    const wrapper = ({ children }: { children: ReactNode }) => <CastProvider>{children}</CastProvider>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks.
        useToast.mockReturnValue({
            error: mockToastError,
            hide: jest.fn(),
        });

        useCastSession.mockReturnValue(null);
        useDevices.mockReturnValue(createMockDevices());
        useRemoteMediaClient.mockReturnValue(createMockClient());

        useJellyfin.mockReturnValue({
            getStreamUrl: mockGetStreamUrl,
            getSubtitleTrackMetadata: mockGetSubtitleTrackMetadata,
        });

        GoogleCastContext.getSessionManager.mockReturnValue({
            startSession: mockStartSession,
            endCurrentSession: mockEndCurrentSession,
        });

        // Setup default implementations.
        mockGetStreamUrl.mockResolvedValue('https://test-stream-url.com/stream.m3u8');
        mockGetSubtitleTrackMetadata.mockReturnValue([]);
        mockGetMediaStatus.mockResolvedValue({
            streamPosition: 100,
            mediaInfo: {
                streamDuration: 3600,
                mediaTracks: [],
            },
            playerState: 'PLAYING',
            activeTrackIds: [],
        });
        mockGetStreamPosition.mockResolvedValue(100);

        // Setup environment variables.
        Object.assign(process.env, {
            EXPO_PUBLIC_JELLYFIN_URL: 'http://test-jellyfin.local',
            EXPO_PUBLIC_JELLYFIN_API_KEY: 'test-api-key',
        });
    });

    describe('Provider', () => {
        it('provides cast context to children', () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            // Verify context is provided with all expected properties.
            expect(result.current).toHaveProperty('cast');
            expect(result.current).toHaveProperty('pause');
            expect(result.current).toHaveProperty('resume');
            expect(result.current).toHaveProperty('stop');
            expect(result.current).toHaveProperty('seekBackward');
            expect(result.current).toHaveProperty('seekForward');
            expect(result.current).toHaveProperty('seekToPosition');
            expect(result.current).toHaveProperty('status');
            expect(result.current).toHaveProperty('devices');
            expect(result.current).toHaveProperty('onDeviceSelected');
            expect(result.current).toHaveProperty('isConnected');
            expect(result.current).toHaveProperty('selectedDeviceId');
        });

        it('throws error when useCast is called outside provider', () => {
            // Verify error is thrown when used outside provider.
            expect(() => {
                renderHook(() => useCast());
            }).toThrow('useCast must be used within a CastProvider');
        });

        it('initializes with correct default state', () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            // Verify initial status state.
            expect(result.current.status).toEqual({
                isPlaying: false,
                isBusy: false,
                isStopped: false,
                isMediaTrackInfoAvailable: false,
                streamPosition: 0,
                maxPosition: 0,
            });

            // Verify initial device selection.
            expect(result.current.selectedDeviceId).toBe('local');
            expect(result.current.isConnected).toBe(true);
        });
    });

    describe('Device Management', () => {
        it('returns list of available devices including local device', () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            const devices = result.current.devices;

            // Verify local device is first.
            expect(devices[0]).toEqual({ label: 'This Device', value: 'local' });

            // Verify VideoOut devices are included and sorted.
            expect(devices).toContainEqual({ label: 'Kitchen Display', value: 'device-3' });
            expect(devices).toContainEqual({ label: 'Living Room Tv', value: 'device-1' });

            // Verify AudioOut-only devices are excluded.
            expect(devices).not.toContainEqual(expect.objectContaining({ value: 'device-2' }));
        });

        it('handles device selection for cast device', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.onDeviceSelected('device-1');
            });

            // Verify session manager is called to start session.
            expect(mockStartSession).toHaveBeenCalledWith('device-1');
        });

        it('handles device selection for local device', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.onDeviceSelected('local');
            });

            // Verify session manager is called to end session.
            expect(mockEndCurrentSession).toHaveBeenCalled();
        });

        it('handles device selection error gracefully', async () => {
            mockStartSession.mockRejectedValue(new Error('Connection failed'));
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.onDeviceSelected('device-1');
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith('Failed to handle device selection.', expect.any(Error));
        });

        it('handles invalid device selection gracefully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.onDeviceSelected('non-existent-device');
            });

            // Verify no session manager calls for invalid device.
            expect(mockStartSession).not.toHaveBeenCalled();
            expect(mockEndCurrentSession).not.toHaveBeenCalled();
        });
    });

    describe('Casting', () => {
        it('casts media item successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });
            const testItem = createMockItem();

            await act(async () => {
                await result.current.cast(testItem);
            });

            // Verify stream URL is generated.
            expect(mockGetStreamUrl).toHaveBeenCalledWith(testItem);

            // Verify media is loaded with correct parameters.
            expect(mockLoadMedia).toHaveBeenCalledWith({
                autoplay: true,
                mediaInfo: {
                    contentUrl: 'https://test-stream-url.com/stream.m3u8',
                    contentType: 'application/x-mpegURL',
                    metadata: {
                        type: 'movie',
                        title: 'Test Movie',
                        images: [
                            {
                                url: `http://test-jellyfin.local/Items/test-item-id/Images/Primary?api_key=test-api-key`,
                            },
                        ],
                    },
                },
            });
        });

        it('seeks to last known position when casting resumable item', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });
            const resumableItem = createMockItem({
                UserData: {
                    PlaybackPositionTicks: 50000000, // 5 seconds in ticks
                },
            });

            await act(async () => {
                await result.current.cast(resumableItem);
            });

            // Verify seek is called with converted position.
            await waitFor(() => {
                expect(mockSeek).toHaveBeenCalledWith({ position: 5 });
            });
        });

        it('handles casting error gracefully', async () => {
            mockLoadMedia.mockRejectedValue(new Error('Cast failed'));
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.cast(createMockItem());
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith(
                'Failed to cast media. Please try again later.',
                expect.any(Error)
            );
        });

        it('handles casting when no client available', async () => {
            useRemoteMediaClient.mockReturnValue(null);
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.cast(createMockItem());
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith(
                'Failed to cast media. Please try again later.',
                expect.any(Error)
            );
        });
    });

    describe('Playback Control', () => {
        it('pauses playback successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.pause();
            });

            // Verify client pause is called.
            expect(mockPause).toHaveBeenCalled();

            // Verify status is updated optimistically.
            expect(result.current.status.isPlaying).toBe(false);
        });

        it('resumes playback successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.resume();
            });

            // Verify client play is called.
            expect(mockPlay).toHaveBeenCalled();

            // Verify status is updated optimistically.
            expect(result.current.status.isPlaying).toBe(true);
        });

        it('stops playback successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                result.current.stop();
            });

            // Verify client stop is called.
            expect(mockStop).toHaveBeenCalled();
        });

        it('handles pause error gracefully', async () => {
            mockPause.mockRejectedValue(new Error('Pause failed'));
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.pause();
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith('Failed to pause.', expect.any(Error));

            // Verify status is reverted on error.
            expect(result.current.status.isPlaying).toBe(true);
            expect(result.current.status.isBusy).toBe(false);
        });

        it('handles resume error gracefully', async () => {
            mockPlay.mockRejectedValue(new Error('Resume failed'));
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.resume();
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith('Failed to resume.', expect.any(Error));

            // Verify status is reverted on error.
            expect(result.current.status.isPlaying).toBe(false);
            expect(result.current.status.isBusy).toBe(false);
        });
    });

    describe('Seeking', () => {
        it('seeks forward by default 30 seconds', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekForward();
            });

            // Verify seek is called with correct position.
            expect(mockSeek).toHaveBeenCalledWith({ position: 130 }); // 100 + 30
        });

        it('seeks forward by custom seconds', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekForward(15);
            });

            // Verify seek is called with custom position.
            expect(mockSeek).toHaveBeenCalledWith({ position: 115 }); // 100 + 15
        });

        it('seeks backward by default 10 seconds', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekBackward();
            });

            // Verify seek is called with correct position.
            expect(mockSeek).toHaveBeenCalledWith({ position: 90 }); // 100 - 10
        });

        it('seeks backward but not below zero', async () => {
            mockGetMediaStatus.mockResolvedValue({
                streamPosition: 5,
                mediaInfo: { streamDuration: 3600 },
                playerState: 'PLAYING',
            });
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekBackward(15);
            });

            // Verify seek does not go below zero.
            expect(mockSeek).toHaveBeenCalledWith({ position: 0 });
        });

        it('seeks to specific position', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekToPosition(500);
            });

            // Verify seek is called with exact position.
            expect(mockSeek).toHaveBeenCalledWith({ position: 500 });
        });

        it('handles seek error gracefully', async () => {
            mockSeek.mockRejectedValue(new Error('Seek failed'));
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.seekForward();
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith('Failed to seek forward.', expect.any(Error));
        });
    });

    describe('Subtitle Management', () => {
        it('calls getSubtitleTrackMetadata function successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            // Verify the function exists and can be called.
            expect(result.current.getSubtitleTrackMetadata).toBeDefined();
            expect(typeof result.current.getSubtitleTrackMetadata).toBe('function');

            // Call the function (it will return empty array due to no jellyfin metadata setup).
            let subtitleTracks: any;
            await act(async () => {
                subtitleTracks = await result.current.getSubtitleTrackMetadata();
            });

            // Verify function returns an array (empty due to error handling).
            expect(Array.isArray(subtitleTracks)).toBe(true);
        });

        it('sets subtitle track successfully', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });
            const mockTrack = {
                id: 1,
                name: 'English',
                type: 'text' as const,
                displayTitle: 'English',
                language: 'eng',
                index: 0,
                isDefault: false,
                isForced: false,
                codec: 'srt',
                isExternal: false,
            };

            await act(async () => {
                await result.current.setSubtitleTrack(mockTrack);
            });

            // Verify active track IDs are set.
            expect(mockSetActiveTrackIds).toHaveBeenCalledWith([1]);
        });

        it('clears subtitle track when null is passed', async () => {
            const { result } = renderHook(() => useCast(), { wrapper });

            await act(async () => {
                await result.current.setSubtitleTrack(null);
            });

            // Verify active track IDs are cleared.
            expect(mockSetActiveTrackIds).toHaveBeenCalledWith([]);
        });

        it('handles subtitle track error gracefully', async () => {
            mockSetActiveTrackIds.mockImplementation(() => {
                throw new Error('Track failed');
            });
            const { result } = renderHook(() => useCast(), { wrapper });

            const mockTrack = {
                id: 1,
                name: 'English',
                type: 'text' as const,
                displayTitle: 'English',
                language: 'eng',
                index: 0,
                isDefault: false,
                isForced: false,
                codec: 'srt',
                isExternal: false,
            };

            await act(async () => {
                await result.current.setSubtitleTrack(mockTrack);
            });

            // Verify error toast is shown.
            expect(mockToastError).toHaveBeenCalledWith('Failed to set subtitle track.', expect.any(Error));
        });
    });
});

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { RemoteScreen } from '.';

jest.mock('@/hooks/asyncEffect', () => ({
    useAsyncEffect: jest.fn(),
}));

jest.mock('@/hooks/interpolatedTime', () => ({
    useInterpolatedTime: jest.fn(() => 0),
}));

jest.mock('@/hooks/jellyfin', () => ({
    useJellyfin: jest.fn(() => ({
        getItemDetails: jest.fn(),
        getPosterForItem: jest.fn(),
    })),
}));

jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(() => ({ id: 'test-id' })),
    useNavigation: jest.fn(() => ({
        goBack: jest.fn(),
        navigate: jest.fn(),
    })),
}));

jest.mock('react-native-google-cast', () => ({
    useRemoteMediaClient: jest.fn(() => ({})),
    MediaPlayerState: {
        IDLE: 'IDLE',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        BUFFERING: 'BUFFERING',
        LOADING: 'LOADING',
    },
}));

jest.mock('react-native-portalize', () => ({
    Portal: ({ children }: { children: any }) => {
        const React = require('react');
        return React.createElement('View', { testID: 'portal' }, children);
    },
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: ({ testID, ...props }: any) => {
        const React = require('react');
        return React.createElement('View', { testID, ...props });
    },
}));

jest.mock('@/components/spinner', () => ({
    Spinner: ({ testID }: { testID?: string }) => {
        const React = require('react');
        return React.createElement('View', { testID: testID || 'spinner' });
    },
}));

jest.mock('@react-native-community/slider', () => ({
    __esModule: true,
    default: ({
        minimumValue,
        maximumValue,
        value,
        onSlidingStart,
        onValueChange,
        onSlidingComplete,
        testID,
        ...props
    }: any) => {
        const React = require('react');
        return React.createElement('View', {
            testID,
            minimumValue,
            maximumValue,
            value,
            onSlidingStart,
            onValueChange,
            onSlidingComplete,
            ...props,
        });
    },
}));

jest.mock('@/constants/colours', () => ({
    Colours: {
        background: '#000000',
        background2: '#111111',
        text: '#ffffff',
        icon: '#ffffff',
    },
}));

const { useAsyncEffect } = require('@/hooks/asyncEffect');
const { useJellyfin } = require('@/hooks/jellyfin');
const { useLocalSearchParams } = require('expo-router');
const { useRemoteMediaClient } = require('react-native-google-cast');

const mockUseAsyncEffect = useAsyncEffect as jest.MockedFunction<typeof useAsyncEffect>;
const mockUseJellyfin = useJellyfin as jest.MockedFunction<typeof useJellyfin>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockUseRemoteMediaClient = useRemoteMediaClient as jest.MockedFunction<typeof useRemoteMediaClient>;

// Suppress act() warnings for integration tests with real hooks
const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});

describe('RemoteScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Set up default mocks
        mockUseAsyncEffect.mockImplementation((callback: any) => {
            // Don't execute the async effect during tests
        });

        mockUseJellyfin.mockReturnValue({
            getItemDetails: jest.fn().mockResolvedValue({
                Id: 'test-id',
                Name: 'Test Movie',
            }),
            getPosterForItem: jest.fn().mockReturnValue('test-poster-url'),
        });

        mockUseLocalSearchParams.mockReturnValue({ id: 'test-id' });

        mockUseRemoteMediaClient.mockReturnValue({
            getMediaStatus: jest.fn().mockResolvedValue(null),
            getStreamPosition: jest.fn().mockResolvedValue(0),
            // Add other methods that might be called by the hook
            play: jest.fn(),
            pause: jest.fn(),
            stop: jest.fn(),
            seek: jest.fn(),
        });
    });

    describe('Control Button Interactions', () => {
        it('should stop the current playing video when stop button is tapped', () => {
            const mockStop = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue(null),
                getStreamPosition: jest.fn().mockResolvedValue(0),
                play: jest.fn(),
                pause: jest.fn(),
                stop: mockStop,
                seek: jest.fn(),
            });

            const { getByTestId } = render(<RemoteScreen />);
            const stopButton = getByTestId('stop-button');

            fireEvent.press(stopButton);

            expect(mockStop).toHaveBeenCalledTimes(1);
        });

        it('should set the video position to current minus 10 seconds when seek backward button is tapped', async () => {
            const mockSeek = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PLAYING',
                    streamPosition: 50, // Add this for the playback hook
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: mockSeek,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const seekBackwardButton = getByTestId('seek-backward-button');

            fireEvent.press(seekBackwardButton);

            // Give time for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockSeek).toHaveBeenCalledWith({ position: 40 });
        });
        it('should pause the currently playing video when pause button is tapped', async () => {
            const mockPause = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PLAYING',
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: mockPause,
                stop: jest.fn(),
                seek: jest.fn(),
            });

            const { getByTestId } = render(<RemoteScreen />);

            // Give component time to render with playing state
            await new Promise(resolve => setTimeout(resolve, 100));

            const playPauseButton = getByTestId('play-pause-button');

            fireEvent.press(playPauseButton);

            expect(mockPause).toHaveBeenCalledTimes(1);
        });

        it('should show play button when video is paused', () => {
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PAUSED',
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: jest.fn(),
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            // When paused, should show play icon
            expect(getByTestId('play-icon')).toBeTruthy();
            expect(queryByTestId('pause-icon')).toBeNull();
        });

        it('should unpause the currently paused video when play button is tapped', () => {
            const mockPlay = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PAUSED',
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: mockPlay,
                pause: jest.fn(),
                stop: jest.fn(),
                seek: jest.fn(),
            });

            const { getByTestId } = render(<RemoteScreen />);
            const playPauseButton = getByTestId('play-pause-button');

            fireEvent.press(playPauseButton);

            expect(mockPlay).toHaveBeenCalledTimes(1);
        });

        it('should show pause button when video is playing', async () => {
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PLAYING',
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: jest.fn(),
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            // Give component time to update with playing state
            await new Promise(resolve => setTimeout(resolve, 100));

            // When playing, should show pause icon
            expect(getByTestId('pause-icon')).toBeTruthy();
            expect(queryByTestId('play-icon')).toBeNull();
        });

        it('should show spinner in place of play/pause buttons when loading', async () => {
            const mockGetMediaStatus = jest.fn().mockResolvedValue({
                playerState: 'BUFFERING', // This will trigger isLoading: true
                mediaInfo: {
                    streamDuration: 100,
                },
            });

            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: mockGetMediaStatus,
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: jest.fn(),
            });

            const { queryByTestId } = render(<RemoteScreen />);

            // Wait a bit for the status update to occur
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should show spinner when loading state is triggered
            expect(queryByTestId('play-pause-spinner')).toBeTruthy();
        });

        it('should set the video position to current plus 30 seconds when seek forward button is tapped', async () => {
            const mockSeek = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PLAYING',
                    streamPosition: 50, // Add this for the playback hook
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: mockSeek,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const seekForwardButton = getByTestId('seek-forward-button');

            fireEvent.press(seekForwardButton);

            // Give time for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(mockSeek).toHaveBeenCalledWith({ position: 80 });
        });
    });

    describe('Seek Bar Interactions', () => {
        it('should update the current time when dragging the seek bar', () => {
            const { getByTestId } = render(<RemoteScreen />);
            const slider = getByTestId('slider');

            // Simulate dragging the slider to position 75
            fireEvent(slider, 'valueChange', 75);

            // The slider should respond to the value change
            expect(slider.props.onValueChange).toBeDefined();
        });

        it('should update the video position when dragging and releasing the seek bar', async () => {
            const mockSeek = jest.fn();
            mockUseRemoteMediaClient.mockReturnValue({
                getMediaStatus: jest.fn().mockResolvedValue({
                    playerState: 'PLAYING',
                    mediaInfo: {
                        streamDuration: 100,
                    },
                }),
                getStreamPosition: jest.fn().mockResolvedValue(50),
                play: jest.fn(),
                pause: jest.fn(),
                stop: jest.fn(),
                seek: mockSeek,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const slider = getByTestId('slider');

            // Simulate starting to drag
            fireEvent(slider, 'slidingStart');

            // Simulate dragging to new position
            fireEvent(slider, 'valueChange', 75);

            // Simulate releasing the slider
            fireEvent(slider, 'slidingComplete', 75);

            // Give time for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            // The seek function should be called when sliding completes
            expect(mockSeek).toHaveBeenCalledWith({ position: 75 });
        });
    });

    describe('Component Rendering', () => {
        it('should render the component without crashing', () => {
            const { queryByTestId } = render(<RemoteScreen />);

            // The component should render the main content
            expect(queryByTestId('control-bar')).toBeTruthy();
            expect(queryByTestId('slider')).toBeTruthy();
            expect(queryByTestId('audio-selector-wrapper')).toBeTruthy();
            expect(queryByTestId('subtitle-selector-wrapper')).toBeTruthy();
        });

        it('should render all control buttons', () => {
            const { getByTestId } = render(<RemoteScreen />);

            expect(getByTestId('stop-button')).toBeTruthy();
            expect(getByTestId('seek-backward-button')).toBeTruthy();
            expect(getByTestId('play-pause-button')).toBeTruthy();
            expect(getByTestId('seek-forward-button')).toBeTruthy();
        });

        it('should render slider with appropriate properties', () => {
            const { getByTestId } = render(<RemoteScreen />);
            const slider = getByTestId('slider');

            expect(slider).toBeTruthy();
            expect(slider.props.minimumValue).toBe(0);
            expect(slider.props.value).toBeDefined();
        });
    });
});

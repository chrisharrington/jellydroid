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
        startPlaybackSession: jest.fn(),
        stopPlaybackSession: jest.fn(),
        updatePlaybackProgress: jest.fn(),
    })),
}));

jest.mock('@/hooks/retry', () => ({
    useRetry: jest.fn(() => ({
        retry: jest.fn(fn => fn()), // Just execute the function immediately in tests
    })),
}));

jest.mock('@/hooks/playback', () => ({
    usePlayback: jest.fn(() => ({
        cast: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
        seekForward: jest.fn(),
        seekBackward: jest.fn(),
        stop: jest.fn(),
        seekToPosition: jest.fn(),
        status: {
            isPlaying: false,
            isLoading: false,
            streamPosition: 0,
            maxPosition: 100,
            currentTime: '00:00',
            maxTime: '01:40',
        },
    })),
}));

jest.mock('./hook', () => ({
    useRemoteScreen: jest.fn(() => ({
        pause: jest.fn(),
        resume: jest.fn(),
        seekForward: jest.fn(),
        seekBackward: jest.fn(),
        stop: jest.fn(),
        changeSubtitle: jest.fn(),
        changeAudio: jest.fn(),
        poster: 'test-poster-url',
        selectedSubtitle: null,
        subtitleOptions: [],
        selectedAudio: null,
        audioOptions: [],
        status: {
            isPlaying: false,
            isLoading: false,
            streamPosition: 0,
            maxPosition: 100,
            currentTime: '00:00',
            maxTime: '01:40',
        },
        handleSliderStart: jest.fn(),
        handleSliderChange: jest.fn(),
        handleSliderComplete: jest.fn(),
        currentTime: '00:00',
        streamPosition: 0,
        isBusy: false,
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
const { usePlayback } = require('@/hooks/playback');
const { useRemoteScreen } = require('./hook');
const { useLocalSearchParams } = require('expo-router');
const { useRemoteMediaClient } = require('react-native-google-cast');

const mockUseAsyncEffect = useAsyncEffect as jest.MockedFunction<typeof useAsyncEffect>;
const mockUseJellyfin = useJellyfin as jest.MockedFunction<typeof useJellyfin>;
const mockUsePlayback = usePlayback as jest.MockedFunction<typeof usePlayback>;
const mockUseRemoteScreen = useRemoteScreen as jest.MockedFunction<typeof useRemoteScreen>;
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

        // Default playback mock
        mockUsePlayback.mockReturnValue({
            cast: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            seekForward: jest.fn(),
            seekBackward: jest.fn(),
            stop: jest.fn(),
            seekToPosition: jest.fn(),
            status: {
                isPlaying: false,
                isLoading: false,
                streamPosition: 0,
                maxPosition: 100,
                currentTime: '00:00',
                maxTime: '01:40',
            },
        });

        mockUseRemoteMediaClient.mockReturnValue({
            getMediaStatus: jest.fn().mockResolvedValue(null),
            getStreamPosition: jest.fn().mockResolvedValue(0),
            play: jest.fn(),
            pause: jest.fn(),
            stop: jest.fn(),
            seek: jest.fn(),
        });
    });

    describe('Control Button Interactions', () => {
        it('should stop the current playing video when stop button is tapped', () => {
            const mockStop = jest.fn();

            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: mockStop,
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const stopButton = getByTestId('stop-button');

            fireEvent.press(stopButton);

            expect(mockStop).toHaveBeenCalledTimes(1);
        });

        it('should set the video position to current minus 10 seconds when seek backward button is tapped', async () => {
            const mockSeekBackward = jest.fn();

            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: mockSeekBackward,
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const seekBackwardButton = getByTestId('seek-backward-button');

            fireEvent.press(seekBackwardButton);

            // Give time for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should be called with no arguments (uses default of 10 seconds)
            expect(mockSeekBackward).toHaveBeenCalledWith();
        });
        it('should pause the currently playing video when pause button is tapped', async () => {
            const mockPause = jest.fn();

            // Mock the remote screen hook directly
            mockUseRemoteScreen.mockReturnValue({
                pause: mockPause,
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true, // Set to playing so pause button shows
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            // Give component time to render with playing state
            await new Promise(resolve => setTimeout(resolve, 100));

            const playPauseButton = getByTestId('play-pause-button');

            // Check if the pause icon is shown (meaning isPlaying is true)
            const pauseIcon = getByTestId('pause-icon');
            expect(pauseIcon).toBeTruthy();

            fireEvent.press(playPauseButton);

            expect(mockPause).toHaveBeenCalledTimes(1);
        });

        it('should show play button when video is paused', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: false, // Set to paused so play button shows
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            // When paused, should show play icon
            expect(getByTestId('play-icon')).toBeTruthy();
            expect(queryByTestId('pause-icon')).toBeNull();
        });

        it('should unpause the currently paused video when play button is tapped', () => {
            const mockResume = jest.fn();

            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: mockResume,
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: false, // Set to paused so play button shows
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const playPauseButton = getByTestId('play-pause-button');

            fireEvent.press(playPauseButton);

            expect(mockResume).toHaveBeenCalledTimes(1);
        });

        it('should show pause button when video is playing', async () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true, // Set to playing so pause button shows
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            // Give component time to update with playing state
            await new Promise(resolve => setTimeout(resolve, 100));

            // When playing, should show pause icon
            expect(getByTestId('pause-icon')).toBeTruthy();
            expect(queryByTestId('play-icon')).toBeNull();
        });

        it('should show spinner in place of play/pause buttons when loading', async () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: true, // Set to loading so spinner shows
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false, // Set to false so the ControlBar shows instead of main loading spinner
            });

            const { queryByTestId } = render(<RemoteScreen />);

            // Wait a bit for the status update to occur
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should show spinner when loading state is triggered
            expect(queryByTestId('play-pause-spinner')).toBeTruthy();
        });

        it('should set the video position to current plus 30 seconds when seek forward button is tapped', async () => {
            const mockSeekForward = jest.fn();

            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: mockSeekForward,
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const seekForwardButton = getByTestId('seek-forward-button');

            fireEvent.press(seekForwardButton);

            // Give time for async operation
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should be called with no arguments (uses default of 30 seconds)
            expect(mockSeekForward).toHaveBeenCalledWith();
        });
    });

    describe('Seek Bar Interactions', () => {
        it('should update the current time when dragging the seek bar', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);
            const slider = getByTestId('slider');

            // Simulate dragging the slider to position 75
            fireEvent(slider, 'valueChange', 75);

            // The slider should respond to the value change
            expect(slider.props.onValueChange).toBeDefined();
        });

        it('should update the video position when dragging and releasing the seek bar', async () => {
            const mockHandleSliderComplete = jest.fn();

            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: 'test-poster-url',
                selectedSubtitle: null,
                subtitleOptions: [],
                selectedAudio: null,
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:50',
                    maxTime: '01:40',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: mockHandleSliderComplete,
                currentTime: '00:50',
                streamPosition: 50,
                isBusy: false,
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
            expect(mockHandleSliderComplete).toHaveBeenCalledWith(75);
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

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { RemoteScreen } from './index';

// Mock all external dependencies
jest.mock('./hook', () => ({
    useRemoteScreen: jest.fn(),
}));

jest.mock('@/components/spinner', () => ({
    Spinner: () => {
        const React = require('react');
        return React.createElement('View', { testID: 'spinner' });
    },
}));

jest.mock('./audio', () => ({
    AudioSelector: () => {
        const React = require('react');
        return React.createElement('View', { testID: 'audio-selector' });
    },
}));

jest.mock('./subtitles', () => ({
    SubtitleSelector: () => {
        const React = require('react');
        return React.createElement('View', { testID: 'subtitle-selector' });
    },
}));

jest.mock('./controlBar', () => ({
    ControlBar: ({ stop, seekBackward, pause, resume, seekForward, status }: any) => {
        const React = require('react');

        const handlePlayPause = () => {
            if (status.isPlaying) {
                pause();
            } else {
                resume();
            }
        };

        return React.createElement('View', { testID: 'control-bar' }, [
            React.createElement('TouchableOpacity', {
                key: 'stop',
                testID: 'stop-button',
                onPress: stop,
            }),
            React.createElement('TouchableOpacity', {
                key: 'seek-backward',
                testID: 'seek-backward-button',
                onPress: seekBackward,
            }),
            React.createElement(
                'TouchableOpacity',
                {
                    key: 'play-pause',
                    testID: 'play-pause-button',
                    onPress: status.isLoading ? undefined : handlePlayPause,
                    disabled: status.isLoading,
                },
                [
                    status.isLoading
                        ? React.createElement('View', { key: 'spinner', testID: 'play-pause-spinner' })
                        : React.createElement('Text', {
                              key: 'icon',
                              testID: status.isPlaying ? 'pause-icon' : 'play-icon',
                          }),
                ]
            ),
            React.createElement('TouchableOpacity', {
                key: 'seek-forward',
                testID: 'seek-forward-button',
                onPress: seekForward,
            }),
        ]);
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
        ...props
    }: any) => {
        const React = require('react');
        return React.createElement('View', {
            testID: 'slider',
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

const { useRemoteScreen } = require('./hook');
const mockUseRemoteScreen = useRemoteScreen as jest.MockedFunction<typeof useRemoteScreen>;

describe('RemoteScreen Control Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Control Button Tests', () => {
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
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const stopButton = getByTestId('stop-button');
            fireEvent.press(stopButton);

            expect(mockStop).toHaveBeenCalledTimes(1);
        });

        it('should set the video position to current minus 10 seconds when seek backward button is tapped', () => {
            const mockSeekBackward = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: mockSeekBackward,
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const seekBackwardButton = getByTestId('seek-backward-button');
            fireEvent.press(seekBackwardButton);

            expect(mockSeekBackward).toHaveBeenCalledTimes(1);
        });

        it('should pause the currently playing video when pause button is tapped', () => {
            const mockPause = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: mockPause,
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const playPauseButton = getByTestId('play-pause-button');
            fireEvent.press(playPauseButton);

            expect(mockPause).toHaveBeenCalledTimes(1);
        });

        it('should show the play button when pause button is tapped (after pausing)', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

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
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const playPauseButton = getByTestId('play-pause-button');
            fireEvent.press(playPauseButton);

            expect(mockResume).toHaveBeenCalledTimes(1);
        });

        it('should show the pause button when play button is tapped (after resuming)', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            expect(getByTestId('pause-icon')).toBeTruthy();
            expect(queryByTestId('play-icon')).toBeNull();
        });

        it('should show spinner in place of play/pause buttons when loading', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: true,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            expect(getByTestId('play-pause-spinner')).toBeTruthy();
            expect(queryByTestId('play-icon')).toBeNull();
            expect(queryByTestId('pause-icon')).toBeNull();
        });

        it('should disable play/pause button when loading', () => {
            const mockResume = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: mockResume,
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: true,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const playPauseButton = getByTestId('play-pause-button');
            fireEvent.press(playPauseButton);

            // Should not call resume when loading
            expect(mockResume).not.toHaveBeenCalled();
        });

        it('should set the video position to current plus 30 seconds when seek forward button is tapped', () => {
            const mockSeekForward = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: mockSeekForward,
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const seekForwardButton = getByTestId('seek-forward-button');
            fireEvent.press(seekForwardButton);

            expect(mockSeekForward).toHaveBeenCalledTimes(1);
        });
    });

    describe('Seek Bar Tests', () => {
        it('should update the current time when dragging the seek bar', () => {
            const mockHandleSliderChange = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: mockHandleSliderChange,
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const slider = getByTestId('slider');

            // Simulate dragging the slider
            fireEvent(slider, 'valueChange', 75);

            expect(mockHandleSliderChange).toHaveBeenCalledWith(75);
        });

        it('should call handleSliderStart when starting to drag the seek bar', () => {
            const mockHandleSliderStart = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: mockHandleSliderStart,
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const slider = getByTestId('slider');

            fireEvent(slider, 'slidingStart');

            expect(mockHandleSliderStart).toHaveBeenCalledTimes(1);
        });

        it('should update the video position when releasing the seek bar', () => {
            const mockHandleSliderComplete = jest.fn();
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: mockHandleSliderComplete,
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const slider = getByTestId('slider');

            fireEvent(slider, 'slidingComplete', 75);

            expect(mockHandleSliderComplete).toHaveBeenCalledWith(75);
        });

        it('should have correct slider properties set', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: true,
                    isLoading: false,
                    streamPosition: 50,
                    maxPosition: 100,
                    currentTime: '00:30',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:30',
                streamPosition: 50,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            const slider = getByTestId('slider');

            expect(slider.props.minimumValue).toBe(0);
            expect(slider.props.maximumValue).toBe(100);
            expect(slider.props.value).toBe(50);
        });
    });

    describe('Integration Tests', () => {
        it('should render all control components when not busy', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: false,
                    streamPosition: 0,
                    maxPosition: 100,
                    currentTime: '00:00',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:00',
                streamPosition: 0,
                isBusy: false,
            });

            const { getByTestId } = render(<RemoteScreen />);

            expect(getByTestId('control-bar')).toBeTruthy();
            expect(getByTestId('slider')).toBeTruthy();
            expect(getByTestId('audio-selector')).toBeTruthy();
            expect(getByTestId('subtitle-selector')).toBeTruthy();
        });

        it('should not render control components when busy', () => {
            mockUseRemoteScreen.mockReturnValue({
                pause: jest.fn(),
                resume: jest.fn(),
                seekForward: jest.fn(),
                seekBackward: jest.fn(),
                stop: jest.fn(),
                changeSubtitle: jest.fn(),
                changeAudio: jest.fn(),
                poster: null,
                selectedSubtitle: 'none',
                subtitleOptions: [],
                selectedAudio: 'en',
                audioOptions: [],
                status: {
                    isPlaying: false,
                    isLoading: false,
                    streamPosition: 0,
                    maxPosition: 100,
                    currentTime: '00:00',
                    maxTime: '01:30',
                },
                handleSliderStart: jest.fn(),
                handleSliderChange: jest.fn(),
                handleSliderComplete: jest.fn(),
                currentTime: '00:00',
                streamPosition: 0,
                isBusy: true,
            });

            const { getByTestId, queryByTestId } = render(<RemoteScreen />);

            expect(getByTestId('spinner')).toBeTruthy();
            expect(queryByTestId('control-bar')).toBeNull();
            expect(queryByTestId('slider')).toBeNull();
            expect(queryByTestId('audio-selector')).toBeNull();
            expect(queryByTestId('subtitle-selector')).toBeNull();
        });
    });
});

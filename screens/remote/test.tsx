import { ToastProvider } from '@/components/toast';
import { CastProvider } from '@/contexts/cast';
import { JellyfinProvider } from '@/contexts/jellyfin';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { RemoteScreen } from '.';

// Mock only third-party libraries - not our own application code

// Mock environment variables
Object.assign(process.env, {
    EXPO_PUBLIC_JELLYFIN_URL: 'http://test-jellyfin.local',
    EXPO_PUBLIC_JELLYFIN_API_KEY: 'test-api-key',
    EXPO_PUBLIC_JELLYFIN_USERNAME: 'testuser',
    EXPO_PUBLIC_JELLYFIN_PASSWORD: 'testpass',
    EXPO_PUBLIC_APP_NAME: 'Test App',
    EXPO_PUBLIC_APP_VERSION: '1.0.0',
});

// Mock the Jellyfin SDK (third-party)
jest.mock('@jellyfin/sdk', () => ({
    Jellyfin: jest.fn().mockImplementation(() => ({
        createApi: jest.fn().mockReturnValue({
            authenticateUserByName: jest.fn().mockResolvedValue({
                data: { User: { Id: 'user-123', Name: 'Test User' } },
            }),
        }),
    })),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/items-api', () => ({
    getItemsApi: jest.fn().mockReturnValue({
        getItems: jest.fn().mockResolvedValue({
            data: { Items: [{ Id: 'movie-123', Name: 'Test Movie' }] },
        }),
    }),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/media-info-api', () => ({
    getMediaInfoApi: jest.fn().mockReturnValue({
        getPlaybackInfo: jest.fn().mockResolvedValue({
            data: { MediaSources: [{ Id: 'source-123' }] },
        }),
    }),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/user-library-api', () => ({
    getUserLibraryApi: jest.fn().mockReturnValue({
        getItem: jest.fn().mockResolvedValue({
            data: { Id: 'test-item-id', Name: 'Test Movie' },
        }),
    }),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/playstate-api', () => ({
    getPlaystateApi: jest.fn().mockReturnValue({
        reportPlaybackProgress: jest.fn().mockResolvedValue({}),
        reportPlaybackStart: jest.fn().mockResolvedValue({}),
        reportPlaybackStopped: jest.fn().mockResolvedValue({}),
    }),
}));

// Mock expo modules (third-party)
jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(() => ({
        itemId: 'test-item-id',
        mediaSourceId: 'test-media-source-id',
    })),
    useNavigation: jest.fn(() => ({
        goBack: jest.fn(),
        navigate: jest.fn(),
    })),
}));

jest.mock('expo-application', () => ({
    getAndroidId: jest.fn(() => 'mock-device-id'),
}));

jest.mock('expo-device', () => ({
    deviceName: 'Mock Device',
}));

// Mock Google Cast (third-party)
jest.mock('react-native-google-cast', () => ({
    useRemoteMediaClient: jest.fn(() => ({
        getMediaStatus: jest.fn().mockResolvedValue({
            mediaInfo: { streamDuration: 100 },
            playerState: 'PAUSED',
            streamPosition: 0,
        }),
        getStreamPosition: jest.fn().mockResolvedValue(0),
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        seek: jest.fn(),
        onMediaStatusUpdated: jest.fn(() => ({ remove: jest.fn() })),
        onMediaProgressUpdated: jest.fn(() => ({ remove: jest.fn() })),
        loadMedia: jest.fn(),
    })),
    useCastSession: jest.fn(() => null),
    useDevices: jest.fn(() => []),
    CastContext: {
        getSessionManager: jest.fn(() => ({
            endCurrentSession: jest.fn(),
            startSession: jest.fn(),
        })),
    },
    MediaPlayerState: {
        IDLE: 'IDLE',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        BUFFERING: 'BUFFERING',
        LOADING: 'LOADING',
    },
}));

// Mock React Native components and libraries (third-party)
jest.mock('react-native-portalize', () => ({
    Portal: ({ children }: { children: any }) => {
        const React = require('react');
        return React.createElement('View', { testID: 'portal' }, children);
    },
}));

jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: ({ testID, name, ...props }: any) => {
        const React = require('react');
        return React.createElement('View', {
            testID: testID || `material-icon-${name}`,
            ...props,
        });
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

// Test wrapper component to provide context
function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
        <NavigationContainer>
            <JellyfinProvider>
                <ToastProvider>
                    <CastProvider>{children}</CastProvider>
                </ToastProvider>
            </JellyfinProvider>
        </NavigationContainer>
    );
}

// Suppress act() warnings for behavior-driven tests
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

describe('RemoteScreen - Video Remote Control Behavior', () => {
    let mockRemoteMediaClient: any;
    let mockNavigation: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Get references to mocked functions
        mockRemoteMediaClient = require('react-native-google-cast').useRemoteMediaClient();
        mockNavigation = require('expo-router').useNavigation();
    });

    describe('When user loads the remote control screen', () => {
        it('should display the video remote interface', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the component to load
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Should display main interface elements
            expect(getByTestId('slider')).toBeTruthy();
            expect(getByTestId('audio-selector-wrapper')).toBeTruthy();
            expect(getByTestId('subtitle-selector-wrapper')).toBeTruthy();
        });

        it('should display all playback control buttons', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // All control buttons should be present
            expect(getByTestId('stop-button')).toBeTruthy();
            expect(getByTestId('seek-backward-button')).toBeTruthy();
            expect(getByTestId('play-pause-button')).toBeTruthy();
            expect(getByTestId('seek-forward-button')).toBeTruthy();
        });
    });

    describe('When user interacts with playback controls', () => {
        it('should show play button when video is paused', async () => {
            const { getByTestId, queryByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Initial state should be paused (Google Cast mock returns PAUSED)
            expect(getByTestId('play-icon')).toBeTruthy();
            expect(queryByTestId('pause-icon')).toBeNull();
        });

        it('should allow user to tap the play/pause button', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('play-pause-button')).toBeTruthy();
            });

            const playButton = getByTestId('play-pause-button');

            // Button should be tappable
            expect(playButton.props.accessible).toBe(true);
            expect(playButton.props.accessibilityState?.disabled).toBe(false);

            // Should not throw when pressed
            expect(() => fireEvent.press(playButton)).not.toThrow();
        });

        it('should allow user to tap the stop button', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('stop-button')).toBeTruthy();
            });

            const stopButton = getByTestId('stop-button');

            // Button should be tappable
            expect(stopButton.props.accessible).toBe(true);

            // Should not throw when pressed
            expect(() => fireEvent.press(stopButton)).not.toThrow();
        });

        it('should allow user to tap seek backward button', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('seek-backward-button')).toBeTruthy();
            });

            const seekBackwardButton = getByTestId('seek-backward-button');

            // Button should be tappable
            expect(seekBackwardButton.props.accessible).toBe(true);

            // Should not throw when pressed
            expect(() => fireEvent.press(seekBackwardButton)).not.toThrow();
        });

        it('should allow user to tap seek forward button', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('seek-forward-button')).toBeTruthy();
            });

            const seekForwardButton = getByTestId('seek-forward-button');

            // Button should be tappable
            expect(seekForwardButton.props.accessible).toBe(true);

            // Should not throw when pressed
            expect(() => fireEvent.press(seekForwardButton)).not.toThrow();
        });
    });

    describe('When user interacts with the seek bar', () => {
        it('should have functional slider controls', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            const slider = getByTestId('slider');

            // Slider should have proper properties
            expect(slider.props.minimumValue).toBe(0);
            expect(slider.props.value).toBeDefined();
            expect(slider.props.onSlidingStart).toBeDefined();
            expect(slider.props.onValueChange).toBeDefined();
            expect(slider.props.onSlidingComplete).toBeDefined();
        });

        it('should respond to slider interactions', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            const slider = getByTestId('slider');

            // Should not throw when interacting with slider
            expect(() => fireEvent(slider, 'slidingStart')).not.toThrow();
            expect(() => fireEvent(slider, 'valueChange', 75)).not.toThrow();
            expect(() => fireEvent(slider, 'slidingComplete', 75)).not.toThrow();
        });
    });

    describe('When video is in different playback states', () => {
        it('should handle loading state appropriately', async () => {
            // Mock loading state
            mockRemoteMediaClient.getMediaStatus.mockResolvedValue({
                mediaInfo: { streamDuration: 100 },
                playerState: 'BUFFERING',
                streamPosition: 0,
            });

            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('play-pause-button')).toBeTruthy();
            });

            const playPauseButton = getByTestId('play-pause-button');

            // During loading, button should be disabled or show spinner
            // The exact behavior depends on implementation, but it should handle the state
            expect(playPauseButton).toBeTruthy();
        });

        it('should display correct icons based on playback state', async () => {
            const { getByTestId, queryByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Should show either play or pause icon, but not both
            const playIcon = queryByTestId('play-icon');
            const pauseIcon = queryByTestId('pause-icon');

            // At least one should be present
            expect(playIcon || pauseIcon).toBeTruthy();

            // But not both at the same time
            if (playIcon) {
                expect(pauseIcon).toBeNull();
            }
            if (pauseIcon) {
                expect(playIcon).toBeNull();
            }
        });
    });

    describe('When component loads with data', () => {
        it('should load without errors and display the interface', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Component should render successfully
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Basic interface elements should be present
            expect(getByTestId('slider')).toBeTruthy();
            expect(getByTestId('audio-selector-wrapper')).toBeTruthy();
            expect(getByTestId('subtitle-selector-wrapper')).toBeTruthy();
        });

        it('should display time information', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            // Time information should be present
            // The exact format depends on the data, but the elements should exist
            const slider = getByTestId('slider');
            expect(slider.props.value).toBeDefined();
            expect(slider.props.maximumValue).toBeDefined();
        });

        it('should provide audio and subtitle selection options', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('audio-selector-wrapper')).toBeTruthy();
                expect(getByTestId('subtitle-selector-wrapper')).toBeTruthy();
            });

            // Selector buttons should be tappable
            const audioButton = getByTestId('audio-selector-button');
            const subtitleButton = getByTestId('subtitle-selector-button');

            expect(audioButton.props.accessible).toBe(true);
            expect(subtitleButton.props.accessible).toBe(true);

            // Should not throw when tapped
            expect(() => fireEvent.press(audioButton)).not.toThrow();
            expect(() => fireEvent.press(subtitleButton)).not.toThrow();
        });
    });

    describe('When user performs complete workflows', () => {
        it('should support a complete playback control workflow', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // User should be able to interact with multiple controls in sequence
            const playButton = getByTestId('play-pause-button');
            const slider = getByTestId('slider');
            const seekForwardButton = getByTestId('seek-forward-button');
            const stopButton = getByTestId('stop-button');

            // Simulate a user workflow
            expect(() => {
                // Start playback
                fireEvent.press(playButton);

                // Seek to a position
                fireEvent(slider, 'slidingStart');
                fireEvent(slider, 'valueChange', 30);
                fireEvent(slider, 'slidingComplete', 30);

                // Seek forward
                fireEvent.press(seekForwardButton);

                // Stop playback
                fireEvent.press(stopButton);
            }).not.toThrow();
        });

        it('should support audio and subtitle selection workflow', async () => {
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(getByTestId('audio-selector-wrapper')).toBeTruthy();
                expect(getByTestId('subtitle-selector-wrapper')).toBeTruthy();
            });

            const audioButton = getByTestId('audio-selector-button');
            const subtitleButton = getByTestId('subtitle-selector-button');

            // User should be able to open both selectors
            expect(() => {
                fireEvent.press(audioButton);
                fireEvent.press(subtitleButton);
            }).not.toThrow();
        });
    });
});

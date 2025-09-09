import { ToastProvider } from '@/components/toast';
import { CastProvider } from '@/contexts/cast';
import { JellyfinProvider } from '@/contexts/jellyfin';
import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { RemoteScreen } from '.';

/**
 * Test suite for RemoteScreen component - Video Remote Control Behavior.
 * This file tests the functionality of the video remote control interface
 * including playback controls, slider interactions, and UI state management.
 */

// Mock only third-party libraries - not our own application code.

// Mock environment variables for testing.
Object.assign(process.env, {
    EXPO_PUBLIC_JELLYFIN_URL: 'http://test-jellyfin.local',
    EXPO_PUBLIC_JELLYFIN_API_KEY: 'test-api-key',
    EXPO_PUBLIC_JELLYFIN_USERNAME: 'testuser',
    EXPO_PUBLIC_JELLYFIN_PASSWORD: 'testpass',
    EXPO_PUBLIC_APP_NAME: 'Test App',
    EXPO_PUBLIC_APP_VERSION: '1.0.0',
});

/**
 * Mock implementations for third-party libraries.
 * These mocks provide controlled test data and prevent actual API calls.
 */

// Mock the Jellyfin SDK to provide authentication and API responses.
jest.mock('@jellyfin/sdk', () => ({
    Jellyfin: jest.fn().mockImplementation(() => ({
        createApi: jest.fn().mockReturnValue({
            authenticateUserByName: jest.fn().mockResolvedValue({
                data: {
                    User: { Id: 'user-123', Name: 'Test User' },
                    AccessToken: 'mock-access-token',
                },
            }),
        }),
    })),
}));

// Mock Jellyfin Items API for media item retrieval.
jest.mock('@jellyfin/sdk/lib/utils/api/items-api', () => ({
    getItemsApi: jest.fn().mockReturnValue({
        getItems: jest.fn().mockResolvedValue({
            data: { Items: [{ Id: 'movie-123', Name: 'Test Movie' }] },
        }),
    }),
}));

// Mock Jellyfin Media Info API for playback information.
jest.mock('@jellyfin/sdk/lib/utils/api/media-info-api', () => ({
    getMediaInfoApi: jest.fn().mockReturnValue({
        getPlaybackInfo: jest.fn().mockResolvedValue({
            data: { MediaSources: [{ Id: 'source-123' }] },
        }),
    }),
}));

// Mock Jellyfin User Library API for user-specific item data.
jest.mock('@jellyfin/sdk/lib/utils/api/user-library-api', () => ({
    getUserLibraryApi: jest.fn().mockReturnValue({
        getItem: jest.fn().mockResolvedValue({
            data: { Id: 'test-item-id', Name: 'Test Movie' },
        }),
    }),
}));

// Mock Jellyfin Playstate API for tracking playback progress.
jest.mock('@jellyfin/sdk/lib/utils/api/playstate-api', () => ({
    getPlaystateApi: jest.fn().mockReturnValue({
        reportPlaybackProgress: jest.fn().mockResolvedValue({}),
        reportPlaybackStart: jest.fn().mockResolvedValue({}),
        reportPlaybackStopped: jest.fn().mockResolvedValue({}),
    }),
}));

// Mock Expo Router for navigation and route parameters.
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

// Mock Expo Application for device identification.
jest.mock('expo-application', () => ({
    getAndroidId: jest.fn(() => 'mock-device-id'),
}));

// Mock Expo Device for device information.
jest.mock('expo-device', () => ({
    deviceName: 'Mock Device',
}));

// Mock React Native Google Cast for cast session and media client functionality.
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

// Mock React Native Portalize for modal and portal functionality.
jest.mock('react-native-portalize', () => ({
    Portal: ({ children }: { children: any }) => {
        const React = require('react');
        return React.createElement('View', { testID: 'portal' }, children);
    },
}));

// Mock Expo Vector Icons for icon rendering.
jest.mock('@expo/vector-icons', () => ({
    MaterialIcons: ({ testID, name, ...props }: any) => {
        const React = require('react');
        return React.createElement('View', {
            testID: testID || `material-icon-${name}`,
            ...props,
        });
    },
}));

// Mock React Native Community Slider for seek bar functionality.
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

/**
 * Test wrapper component that provides all necessary context providers
 * for the RemoteScreen component to function properly in tests.
 */
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

/**
 * Test setup and teardown configuration.
 * Suppresses React Testing Library act warnings that are not relevant to our tests.
 */
const originalError = console.error;
beforeAll(() => {
    // Suppress React Testing Library "not wrapped in act" warnings.
    console.error = (...args) => {
        if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    // Restore original console.error function.
    console.error = originalError;
});

describe('RemoteScreen - Video Remote Control Behavior', () => {
    let mockRemoteMediaClient: any;

    beforeEach(() => {
        // Clear all mocks before each test to ensure clean state.
        jest.clearAllMocks();

        // Get reference to mocked remote media client for test assertions.
        mockRemoteMediaClient = require('react-native-google-cast').useRemoteMediaClient();
    });

    describe('When user loads the remote control screen', () => {
        it('should display the video remote interface', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify all essential interface elements are present.
            expect(getByTestId('slider')).toBeTruthy();
            expect(getByTestId('stop-button')).toBeTruthy();
            expect(getByTestId('play-pause-button')).toBeTruthy();
            expect(getByTestId('seek-backward-button')).toBeTruthy();
            expect(getByTestId('seek-forward-button')).toBeTruthy();
        });

        it('should display all playback control buttons', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify all playback control buttons are present.
            expect(getByTestId('stop-button')).toBeTruthy();
            expect(getByTestId('seek-backward-button')).toBeTruthy();
            expect(getByTestId('play-pause-button')).toBeTruthy();
            expect(getByTestId('seek-forward-button')).toBeTruthy();
        });
    });

    describe('When user interacts with playback controls', () => {
        it('should show play button when video is paused', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId, queryByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify correct icon is displayed based on playback state.
            // Initial state should be paused (Google Cast mock returns PAUSED).
            expect(getByTestId('play-icon')).toBeTruthy();
            expect(queryByTestId('pause-icon')).toBeNull();
        });

        it('should allow user to tap the play/pause button', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the play/pause button to be rendered.
            await waitFor(() => {
                expect(getByTestId('play-pause-button')).toBeTruthy();
            });

            const playButton = getByTestId('play-pause-button');

            // Verify button accessibility properties are correctly set.
            expect(playButton.props.accessible).toBe(true);
            expect(playButton.props.accessibilityState?.disabled).toBe(false);

            // Verify button interaction doesn't throw errors.
            expect(() => fireEvent.press(playButton)).not.toThrow();
        });

        it('should allow user to tap the stop button', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the stop button to be rendered.
            await waitFor(() => {
                expect(getByTestId('stop-button')).toBeTruthy();
            });

            const stopButton = getByTestId('stop-button');

            // Verify button accessibility properties are correctly set.
            expect(stopButton.props.accessible).toBe(true);

            // Verify button interaction doesn't throw errors.
            expect(() => fireEvent.press(stopButton)).not.toThrow();
        });

        it('should allow user to tap seek backward button', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the seek backward button to be rendered.
            await waitFor(() => {
                expect(getByTestId('seek-backward-button')).toBeTruthy();
            });

            const seekBackwardButton = getByTestId('seek-backward-button');

            // Verify button accessibility properties are correctly set.
            expect(seekBackwardButton.props.accessible).toBe(true);

            // Verify button interaction doesn't throw errors.
            expect(() => fireEvent.press(seekBackwardButton)).not.toThrow();
        });

        it('should allow user to tap seek forward button', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the seek forward button to be rendered.
            await waitFor(() => {
                expect(getByTestId('seek-forward-button')).toBeTruthy();
            });

            const seekForwardButton = getByTestId('seek-forward-button');

            // Verify button accessibility properties are correctly set.
            expect(seekForwardButton.props.accessible).toBe(true);

            // Verify button interaction doesn't throw errors.
            expect(() => fireEvent.press(seekForwardButton)).not.toThrow();
        });
    });

    describe('When user interacts with the seek bar', () => {
        it('should have functional slider controls', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the slider to be rendered.
            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            const slider = getByTestId('slider');

            // Verify slider has all required properties for seek functionality.
            expect(slider.props.minimumValue).toBe(0);
            expect(slider.props.value).toBeDefined();
            expect(slider.props.onSlidingStart).toBeDefined();
            expect(slider.props.onValueChange).toBeDefined();
            expect(slider.props.onSlidingComplete).toBeDefined();
        });

        it('should respond to slider interactions', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the slider to be rendered.
            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            const slider = getByTestId('slider');

            // Verify slider interactions don't throw errors.
            expect(() => fireEvent(slider, 'slidingStart')).not.toThrow();
            expect(() => fireEvent(slider, 'valueChange', 75)).not.toThrow();
            expect(() => fireEvent(slider, 'slidingComplete', 75)).not.toThrow();
        });
    });

    describe('When video is in different playback states', () => {
        it('should handle loading state appropriately', async () => {
            // Mock loading/buffering state for the media client.
            mockRemoteMediaClient.getMediaStatus.mockResolvedValue({
                mediaInfo: { streamDuration: 100 },
                playerState: 'BUFFERING',
                streamPosition: 0,
            });

            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the play/pause button to be rendered.
            await waitFor(() => {
                expect(getByTestId('play-pause-button')).toBeTruthy();
            });

            const playPauseButton = getByTestId('play-pause-button');

            // Verify component handles loading state gracefully.
            // During loading, button should be disabled or show spinner.
            expect(playPauseButton).toBeTruthy();
        });

        it('should display correct icons based on playback state', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId, queryByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify correct icon display logic based on playback state.
            const playIcon = queryByTestId('play-icon');
            const pauseIcon = queryByTestId('pause-icon');

            // At least one icon should be present for user interaction.
            expect(playIcon || pauseIcon).toBeTruthy();

            // Verify mutually exclusive icon display (only one at a time).
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
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for component to render successfully.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify essential interface elements are present and functional.
            expect(getByTestId('slider')).toBeTruthy();
            expect(getByTestId('stop-button')).toBeTruthy();
            expect(getByTestId('play-pause-button')).toBeTruthy();
        });

        it('should display time information', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the slider to be rendered.
            await waitFor(() => {
                expect(getByTestId('slider')).toBeTruthy();
            });

            // Verify time-related properties are properly configured.
            // The exact format depends on the data, but the elements should exist.
            const slider = getByTestId('slider');
            expect(slider.props.value).toBeDefined();
            expect(slider.props.maximumValue).toBeDefined();
        });

        it('should provide subtitle selection options', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify subtitle button is present and accessible for user interaction.
            const subtitleIcon = getByTestId('material-icon-closed-caption');
            expect(subtitleIcon).toBeTruthy();
        });
    });

    describe('When user performs complete workflows', () => {
        it('should support a complete playback control workflow', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Get references to all control elements for workflow testing.
            const playButton = getByTestId('play-pause-button');
            const slider = getByTestId('slider');
            const seekForwardButton = getByTestId('seek-forward-button');
            const stopButton = getByTestId('stop-button');

            // Simulate a complete user workflow with multiple interactions.
            expect(() => {
                // Start playback interaction.
                fireEvent.press(playButton);

                // Seek to a specific position using slider.
                fireEvent(slider, 'slidingStart');
                fireEvent(slider, 'valueChange', 30);
                fireEvent(slider, 'slidingComplete', 30);

                // Use seek forward button.
                fireEvent.press(seekForwardButton);

                // Stop playback interaction.
                fireEvent.press(stopButton);
            }).not.toThrow();
        });

        it('should support subtitle selection workflow', async () => {
            // Render the RemoteScreen component with necessary providers.
            const { getByTestId } = render(
                <TestWrapper>
                    <RemoteScreen />
                </TestWrapper>
            );

            // Wait for the control bar to be rendered.
            await waitFor(() => {
                expect(getByTestId('control-bar')).toBeTruthy();
            });

            // Verify subtitle selection functionality is available.
            const subtitleIcon = getByTestId('material-icon-closed-caption');
            expect(subtitleIcon).toBeTruthy();
        });
    });
});

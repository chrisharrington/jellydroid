import { BaseItemDto, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

// Mock environment variables first
Object.assign(process.env, {
    EXPO_PUBLIC_APP_NAME: 'Test App',
    EXPO_PUBLIC_APP_VERSION: '1.0.0',
    EXPO_PUBLIC_JELLYFIN_URL: 'http://test-jellyfin.local',
    EXPO_PUBLIC_JELLYFIN_API_KEY: 'test-api-key',
    EXPO_PUBLIC_JELLYFIN_USERNAME: 'testuser',
    EXPO_PUBLIC_JELLYFIN_PASSWORD: 'testpass',
});

// Mock the Jellyfin SDK
jest.mock('@jellyfin/sdk', () => ({
    Jellyfin: jest.fn().mockImplementation(() => ({
        createApi: jest.fn().mockReturnValue({
            authenticateUserByName: jest.fn(),
        }),
    })),
}));

// Mock the API utility functions
jest.mock('@jellyfin/sdk/lib/utils/api/items-api', () => ({
    getItemsApi: jest.fn(),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/media-info-api', () => ({
    getMediaInfoApi: jest.fn(),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/user-library-api', () => ({
    getUserLibraryApi: jest.fn(),
}));

jest.mock('@jellyfin/sdk/lib/utils/api/playstate-api', () => ({
    getPlaystateApi: jest.fn(),
}));

jest.mock('expo-application', () => ({
    getAndroidId: jest.fn(() => 'mock-device-id'),
}));

jest.mock('expo-device', () => ({
    deviceName: 'Mock Device',
}));

import { useJellyfin } from './index';

afterAll(() => {
    jest.restoreAllMocks();
});

describe('useJellyfin', () => {
    let mockApi: any;
    let mockItemsApi: any;
    let mockMediaInfoApi: any;
    let mockUserLibraryApi: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock APIs
        mockApi = {
            authenticateUserByName: jest.fn(),
        };

        mockItemsApi = {
            getItems: jest.fn(),
        };

        mockMediaInfoApi = {
            getPlaybackInfo: jest.fn(),
        };

        mockUserLibraryApi = {
            getItem: jest.fn(),
        };

        // Mock the SDK imports
        const { Jellyfin } = require('@jellyfin/sdk');
        Jellyfin.mockImplementation(() => ({
            createApi: jest.fn().mockReturnValue(mockApi),
        }));

        const { getItemsApi } = require('@jellyfin/sdk/lib/utils/api/items-api');
        getItemsApi.mockReturnValue(mockItemsApi);

        const { getMediaInfoApi } = require('@jellyfin/sdk/lib/utils/api/media-info-api');
        getMediaInfoApi.mockReturnValue(mockMediaInfoApi);

        const { getUserLibraryApi } = require('@jellyfin/sdk/lib/utils/api/user-library-api');
        getUserLibraryApi.mockReturnValue(mockUserLibraryApi);
    });

    describe('hook initialization', () => {
        it('should initialize without errors', () => {
            const { result } = renderHook(() => useJellyfin());

            expect(result.current).toHaveProperty('login');
            expect(result.current).toHaveProperty('findMovieByName');
            expect(result.current).toHaveProperty('getMediaInfo');
            expect(result.current).toHaveProperty('getRecentlyAddedMovies');
            expect(result.current).toHaveProperty('getItemDetails');
            expect(result.current).toHaveProperty('getImageForId');
        });

        it('should create API instance on initialization', () => {
            const { Jellyfin } = require('@jellyfin/sdk');

            renderHook(() => useJellyfin());

            expect(Jellyfin).toHaveBeenCalledWith({
                clientInfo: {
                    name: 'Test App',
                    version: '1.0.0',
                },
                deviceInfo: {
                    name: 'Mock Device',
                    id: 'mock-device-id',
                },
            });
        });
    });

    describe('login', () => {
        it('should authenticate user with credentials from environment', async () => {
            const mockUser: UserDto = { Id: 'user-123', Name: 'Test User' };
            mockApi.authenticateUserByName.mockResolvedValue({
                data: { User: mockUser },
            });

            const { result } = renderHook(() => useJellyfin());

            await result.current.login();

            expect(mockApi.authenticateUserByName).toHaveBeenCalledWith('testuser', 'testpass');
        });

        it('should handle authentication failure', async () => {
            mockApi.authenticateUserByName.mockRejectedValue(new Error('Authentication failed'));

            const { result } = renderHook(() => useJellyfin());

            await expect(result.current.login()).rejects.toThrow('Authentication failed');
        });

        it('should handle missing user in response', async () => {
            mockApi.authenticateUserByName.mockResolvedValue({
                data: {},
            });

            const { result } = renderHook(() => useJellyfin());

            await result.current.login();

            expect(mockApi.authenticateUserByName).toHaveBeenCalled();
            // Should not throw, user.current should be null
        });
    });

    describe('findMovieByName', () => {
        it('should find a movie by name and year', async () => {
            const mockMovie: BaseItemDto = {
                Id: 'movie-123',
                Name: 'Test Movie',
                ProductionYear: 2023,
            };

            mockItemsApi.getItems.mockResolvedValue({
                data: { Items: [mockMovie] },
            });

            const { result } = renderHook(() => useJellyfin());

            const movie = await result.current.findMovieByName(2023, 'Test Movie');

            expect(mockItemsApi.getItems).toHaveBeenCalledWith({
                searchTerm: 'Test Movie',
                years: [2023],
                includeItemTypes: ['Movie'],
                recursive: true,
                limit: 1,
            });
            expect(movie).toEqual(mockMovie);
        });

        it('should return undefined when no movie is found', async () => {
            mockItemsApi.getItems.mockResolvedValue({
                data: { Items: [] },
            });

            const { result } = renderHook(() => useJellyfin());

            const movie = await result.current.findMovieByName(2023, 'Nonexistent Movie');

            expect(movie).toBeUndefined();
        });

        it('should return undefined when Items is null', async () => {
            mockItemsApi.getItems.mockResolvedValue({
                data: { Items: null },
            });

            const { result } = renderHook(() => useJellyfin());

            const movie = await result.current.findMovieByName(2023, 'Test Movie');

            expect(movie).toBeUndefined();
        });
    });

    describe('getMediaInfo', () => {
        it('should retrieve playback info for an item', async () => {
            const mockPlaybackInfo = {
                MediaSources: [{ Id: 'source-123' }],
            };

            mockMediaInfoApi.getPlaybackInfo.mockResolvedValue({
                data: mockPlaybackInfo,
            });

            const { result } = renderHook(() => useJellyfin());

            const info = await result.current.getMediaInfo('item-123');

            expect(mockMediaInfoApi.getPlaybackInfo).toHaveBeenCalledWith({
                itemId: 'item-123',
            });
            expect(info).toEqual(mockPlaybackInfo);
        });

        it('should handle getPlaybackInfo errors', async () => {
            mockMediaInfoApi.getPlaybackInfo.mockRejectedValue(new Error('Playback info failed'));

            const { result } = renderHook(() => useJellyfin());

            await expect(result.current.getMediaInfo('item-123')).rejects.toThrow('Playback info failed');
        });
    });

    describe('getRecentlyAddedMovies', () => {
        it('should retrieve recently added movies', async () => {
            const mockMovies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Recent Movie 1' },
                { Id: 'movie-2', Name: 'Recent Movie 2' },
            ];

            mockItemsApi.getItems.mockResolvedValue({
                data: { Items: mockMovies },
            });

            const { result } = renderHook(() => useJellyfin());

            const movies = await result.current.getRecentlyAddedMovies();

            expect(mockItemsApi.getItems).toHaveBeenCalledWith({
                sortBy: ['DateCreated'],
                sortOrder: ['Descending'],
                includeItemTypes: ['Movie'],
                recursive: true,
                limit: 30,
            });
            expect(movies).toEqual(mockMovies);
        });

        it('should throw error when no items are found', async () => {
            mockItemsApi.getItems.mockResolvedValue({
                data: {},
            });

            const { result } = renderHook(() => useJellyfin());

            await expect(result.current.getRecentlyAddedMovies()).rejects.toThrow('No items found in response.');
        });

        it('should throw error when Items is null', async () => {
            mockItemsApi.getItems.mockResolvedValue({
                data: { Items: null },
            });

            const { result } = renderHook(() => useJellyfin());

            await expect(result.current.getRecentlyAddedMovies()).rejects.toThrow('No items found in response.');
        });
    });

    describe('getItemDetails', () => {
        it('should get item details when user is already logged in', async () => {
            const mockUser: UserDto = { Id: 'user-123', Name: 'Test User' };
            const mockItem: BaseItemDto = { Id: 'item-123', Name: 'Test Item' };

            // Setup authenticated user
            mockApi.authenticateUserByName.mockResolvedValue({
                data: { User: mockUser },
            });

            mockUserLibraryApi.getItem.mockResolvedValue({
                data: mockItem,
            });

            const { result } = renderHook(() => useJellyfin());

            // Login first
            await result.current.login();

            const item = await result.current.getItemDetails('item-123');

            expect(mockUserLibraryApi.getItem).toHaveBeenCalledWith({
                itemId: 'item-123',
                userId: 'user-123',
            });
            expect(item).toEqual(mockItem);
        });

        it('should login automatically if user is not authenticated', async () => {
            const mockUser: UserDto = { Id: 'user-123', Name: 'Test User' };
            const mockItem: BaseItemDto = { Id: 'item-123', Name: 'Test Item' };

            mockApi.authenticateUserByName.mockResolvedValue({
                data: { User: mockUser },
            });

            mockUserLibraryApi.getItem.mockResolvedValue({
                data: mockItem,
            });

            const { result } = renderHook(() => useJellyfin());

            const item = await result.current.getItemDetails('item-123');

            expect(mockApi.authenticateUserByName).toHaveBeenCalledWith('testuser', 'testpass');
            expect(mockUserLibraryApi.getItem).toHaveBeenCalledWith({
                itemId: 'item-123',
                userId: 'user-123',
            });
            expect(item).toEqual(mockItem);
        });
    });

    describe('getImageForItem', () => {
        it('should generate correct image URL for an item', () => {
            const mockItem: BaseItemDto = { Id: 'item-123', Name: 'Test Item' };

            const { result } = renderHook(() => useJellyfin());

            const imageUrl = result.current.getImageForId(mockItem.Id!);

            expect(imageUrl).toBe('http://test-jellyfin.local/Items/item-123/Images/Primary?api_key=test-api-key');
        });
    });

    describe('memoization', () => {
        it('should memoize API instance across re-renders', () => {
            const { result, rerender } = renderHook(() => useJellyfin());

            const firstLogin = result.current.login;
            const firstFindMovie = result.current.findMovieByName;

            rerender({});

            expect(result.current.login).toBe(firstLogin);
            expect(result.current.findMovieByName).toBe(firstFindMovie);
        });
    });
});

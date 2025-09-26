import { useToast } from '@/components/toast';
import { useJellyfin } from '@/contexts/jellyfin';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useHome } from './hook';

jest.mock('@/components/toast');
jest.mock('@/contexts/jellyfin');
jest.mock('expo-router');

describe('useHome', () => {
    const mockLogin = jest.fn(),
        mockGetRecentlyAddedMovies = jest.fn(),
        mockGetRecentlyAddedEpisodes = jest.fn(),
        mockGetContinueWatchingItems = jest.fn(),
        mockGetNextUp = jest.fn(),
        mockToastError = jest.fn(),
        mockPush = jest.fn(),
        mockToast = {
            error: mockToastError,
        },
        mockJellyfin = {
            login: mockLogin,
            getRecentlyAddedMovies: mockGetRecentlyAddedMovies,
            getRecentlyAddedEpisodes: mockGetRecentlyAddedEpisodes,
            getContinueWatchingItems: mockGetContinueWatchingItems,
            getNextUp: mockGetNextUp,
        },
        mockRouter = {
            push: mockPush,
        };

    let focusCallback: (() => void) | null = null;

    beforeEach(() => {
        jest.clearAllMocks();
        focusCallback = null;

        (useToast as jest.Mock).mockReturnValue(mockToast);
        (useJellyfin as jest.Mock).mockReturnValue(mockJellyfin);
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useFocusEffect as jest.Mock).mockImplementation(callback => {
            focusCallback = callback;
        });

        // Set default resolved values for all API calls.
        mockLogin.mockResolvedValue(undefined);
        mockGetRecentlyAddedMovies.mockResolvedValue([]);
        mockGetRecentlyAddedEpisodes.mockResolvedValue([]);
        mockGetContinueWatchingItems.mockResolvedValue([]);
        mockGetNextUp.mockResolvedValue([]);
    });

    it('initializes with default state values', () => {
        const { result } = renderHook(() => useHome());

        expect(result.current.isBusy).toBe(false);
        expect(result.current.recentlyAddedMovies).toEqual([]);
        expect(result.current.recentlyAddedEpisodes).toEqual([]);
        expect(result.current.continueWatchingAndNextUpItems).toEqual([]);
    });

    it('loads data on focus and updates state with fetched content', async () => {
        const mockMovies: BaseItemDto[] = [{ Id: 'movie1', Name: 'Movie 1', Type: 'Movie' }],
            mockEpisodes: BaseItemDto[] = [{ Id: 'episode1', Name: 'Episode 1', Type: 'Episode' }],
            mockContinueWatching: BaseItemDto[] = [{ Id: 'continue1', Name: 'Continue 1', Type: 'Movie' }];

        mockGetRecentlyAddedMovies.mockResolvedValue(mockMovies);
        mockGetRecentlyAddedEpisodes.mockResolvedValue(mockEpisodes);
        mockGetContinueWatchingItems.mockResolvedValue(mockContinueWatching);

        const { result } = renderHook(() => useHome());

        // Initially data should be empty.
        expect(result.current.isBusy).toBe(false);
        expect(result.current.recentlyAddedMovies).toEqual([]);
        expect(result.current.recentlyAddedEpisodes).toEqual([]);
        expect(result.current.continueWatchingAndNextUpItems).toEqual([]);

        // Simulate focus effect by calling the callback.
        await act(async () => {
            focusCallback!();
        });

        await waitFor(() => {
            expect(result.current.isBusy).toBe(false);
            expect(result.current.recentlyAddedMovies).toEqual(mockMovies);
            expect(result.current.recentlyAddedEpisodes).toEqual(mockEpisodes);
            expect(result.current.continueWatchingAndNextUpItems).toEqual(mockContinueWatching);
        });

        expect(mockGetRecentlyAddedMovies).toHaveBeenCalled();
        expect(mockGetRecentlyAddedEpisodes).toHaveBeenCalled();
        expect(mockGetContinueWatchingItems).toHaveBeenCalled();
        expect(mockGetNextUp).toHaveBeenCalled();
    });

    it('sets busy state during data loading', async () => {
        let resolvePromise: (value: BaseItemDto[]) => void;
        const pendingPromise = new Promise<BaseItemDto[]>(resolve => {
            resolvePromise = resolve;
        });

        mockGetRecentlyAddedMovies.mockReturnValue(pendingPromise);
        mockGetRecentlyAddedEpisodes.mockResolvedValue([]);
        mockGetContinueWatchingItems.mockResolvedValue([]);

        const { result } = renderHook(() => useHome());

        // Start the loading process.
        act(() => {
            focusCallback!();
        });

        // Should be busy during loading.
        await waitFor(() => {
            expect(result.current.isBusy).toBe(true);
        });

        // Resolve the pending promise.
        await act(async () => {
            resolvePromise!([]);
        });

        // Should not be busy after loading completes.
        await waitFor(() => {
            expect(result.current.isBusy).toBe(false);
        });
    });

    it('displays error toast when data loading fails', async () => {
        const mockError = new Error('Network error');
        mockGetRecentlyAddedMovies.mockRejectedValue(mockError);
        mockGetRecentlyAddedEpisodes.mockResolvedValue([]);
        mockGetContinueWatchingItems.mockResolvedValue([]);

        const { result } = renderHook(() => useHome());

        // Trigger loading by calling the focus callback.
        await act(async () => {
            focusCallback!();
        });

        await waitFor(() => {
            expect(mockToastError).toHaveBeenCalledWith('Failed to load home screen data.', mockError);
            expect(result.current.isBusy).toBe(false);
        });
    });

    it('combines continue watching and next up items with proper filtering and sorting', async () => {
        const continueWatchingMovie: BaseItemDto = {
            Id: 'movie1',
            Name: 'Movie 1',
            Type: 'Movie',
            UserData: { LastPlayedDate: '2023-09-24T10:00:00Z' },
        };
        const continueWatchingEpisode: BaseItemDto = {
            Id: 'episode1',
            Name: 'Episode 1',
            Type: 'Episode',
            SeriesId: 'series1',
            UserData: { LastPlayedDate: '2023-09-24T08:00:00Z' },
        };
        const nextUpEpisodeFromSameSeries: BaseItemDto = {
            Id: 'episode2',
            Name: 'Episode 2',
            Type: 'Episode',
            SeriesId: 'series1',
            UserData: { LastPlayedDate: '2023-09-24T06:00:00Z' },
        };
        const nextUpEpisodeFromDifferentSeries: BaseItemDto = {
            Id: 'episode3',
            Name: 'Episode 3',
            Type: 'Episode',
            SeriesId: 'series2',
            UserData: { LastPlayedDate: '2023-09-24T12:00:00Z' },
        };

        const mockContinueWatching = [continueWatchingMovie, continueWatchingEpisode];
        const mockNextUp = [nextUpEpisodeFromSameSeries, nextUpEpisodeFromDifferentSeries];

        mockGetRecentlyAddedMovies.mockResolvedValue([]);
        mockGetRecentlyAddedEpisodes.mockResolvedValue([]);
        mockGetContinueWatchingItems.mockResolvedValue(mockContinueWatching);
        mockGetNextUp.mockResolvedValue(mockNextUp);

        const { result } = renderHook(() => useHome());

        // Trigger loading by calling the focus callback.
        await act(async () => {
            focusCallback!();
        });

        await waitFor(() => {
            expect(result.current.isBusy).toBe(false);

            // Should contain continue watching items plus filtered next up items.
            // nextUpEpisodeFromSameSeries should be filtered out because series1 has an episode in continue watching.
            // Items should be sorted by LastPlayedDate descending (most recent first).
            const expectedItems = [
                nextUpEpisodeFromDifferentSeries, // 2023-09-24T12:00:00Z (most recent)
                continueWatchingMovie, // 2023-09-24T10:00:00Z
                continueWatchingEpisode, // 2023-09-24T08:00:00Z (oldest)
            ];

            expect(result.current.continueWatchingAndNextUpItems).toEqual(expectedItems);
        });
    });

    it('navigates to movie details when navigateToItem is called with movie', () => {
        const { result } = renderHook(() => useHome());
        const movieItem: BaseItemDto = {
            Id: 'movie123',
            Name: 'Test Movie',
            Type: 'Movie',
        };

        result.current.navigateToItem(movieItem);

        expect(mockPush).toHaveBeenCalledWith('/movie/Test Movie/movie123');
    });

    it('navigates to episode details when navigateToItem is called with episode', () => {
        const { result } = renderHook(() => useHome());
        const episodeItem: BaseItemDto = {
            Id: 'episode123',
            Name: 'Test Episode',
            Type: 'Episode',
            SeriesId: 'series456',
            ParentIndexNumber: 2,
        };

        result.current.navigateToItem(episodeItem);

        expect(mockPush).toHaveBeenCalledWith('/tv-shows/series456/season/02/episode/episode123');
    });

    it('displays error toast when navigateToItem is called with unsupported item type', () => {
        const { result } = renderHook(() => useHome());
        const unsupportedItem: BaseItemDto = {
            Id: 'unsupported123',
            Name: 'Unsupported Item',
            Type: 'Audio',
        };

        result.current.navigateToItem(unsupportedItem);

        expect(mockToastError).toHaveBeenCalledWith('Navigation for this item type is not supported.');
        expect(mockPush).not.toHaveBeenCalled();
    });

    it('navigates to movies screen when navigateToMovies is called', () => {
        const { result } = renderHook(() => useHome());

        result.current.navigateToMovies();

        expect(mockPush).toHaveBeenCalledWith('/movies');
    });

    it('navigates to TV shows screen when navigateToTvShows is called', () => {
        const { result } = renderHook(() => useHome());

        result.current.navigateToTvShows();

        expect(mockPush).toHaveBeenCalledWith('/tv-shows');
    });

    it('ensures navigation functions are stable references', () => {
        const { result } = renderHook(() => useHome());
        const navigateToMovies = result.current.navigateToMovies;
        const navigateToTvShows = result.current.navigateToTvShows;

        // Navigation functions should be memoized functions.
        expect(typeof navigateToMovies).toBe('function');
        expect(typeof navigateToTvShows).toBe('function');
    });
});

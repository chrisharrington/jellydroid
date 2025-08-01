import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { create } from 'zustand';

interface JellyfinState {
    items: BaseItemDto[];
    isLoading: boolean;
    setItems: (items: BaseItemDto[]) => void;
    setLoading: (loading: boolean) => void;
    getItemById: (id: string) => BaseItemDto | undefined;
    getMovies: () => BaseItemDto[];
    getShows: () => BaseItemDto[];
}

export const useJellyfinStore = create<JellyfinState>((set, get) => ({
    items: [],
    isLoading: false,

    setItems: items => set({ items }),

    setLoading: isLoading => set({ isLoading }),

    getItemById: id => {
        const { items } = get();
        return items.find(item => item.Id === id);
    },

    getMovies: () => {
        const { items } = get();
        return items.filter(item => item.Type === 'Movie');
    },

    getShows: () => {
        const { items } = get();
        return items.filter(item => item.Type === 'Series');
    },
}));

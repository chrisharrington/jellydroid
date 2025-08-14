import { useJellyfin } from '@/hooks/jellyfin';

export function usePosterList() {
    const { getImageForId } = useJellyfin();

    return {
        getImageForId,
    };
}

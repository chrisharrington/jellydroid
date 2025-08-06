import { useCast } from '@/contexts/cast';

export function useCustomCastButton() {
    const { isConnected } = useCast();
    return {
        isConnected,
    };
}

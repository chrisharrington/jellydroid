import { SecondaryButton } from '@/components/button';
import Spinner from '@/components/spinner';
import { AntDesign } from '@expo/vector-icons';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { useToggleWatchedButton } from './hook';

export type ToggleWatchedButtonProps = {
    /** Required. The movie or media item to toggle watched status for. */
    item: BaseItemDto;

    /** Optional. Callback function called when the watched status is successfully toggled. */
    onToggleComplete?: () => void;
};

export function ToggleWatchedButton({ item, onToggleComplete }: ToggleWatchedButtonProps) {
    const { isToggling, isWatched, handleToggleWatched } = useToggleWatchedButton({ item, onToggleComplete });

    return (
        <SecondaryButton onPress={handleToggleWatched} isDisabled={isToggling}>
            {isToggling ? (
                <Spinner size='sm' />
            ) : (
                <AntDesign name={isWatched ? 'checkcircleo' : 'checkcircle'} size={18} color='white' />
            )}
        </SecondaryButton>
    );
}

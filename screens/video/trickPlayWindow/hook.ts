import { useToast } from '@/components/toast';
import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { useEffect, useState } from 'react';
import { TrickPlayWindowProps } from '.';

export function useTrickPlayWindow(props: TrickPlayWindowProps) {
    const { getTrickplayTileFileUri } = useJellyfin(),
        [isBusy, setBusy] = useState<boolean>(false),
        [imageUri, setImageUri] = useState<string | null>(null),
        toast = useToast();

    useAsyncEffect(async () => {
        try {
            // Show loading indicator.
            setBusy(true);

            // Retrieve the trick play image file URI.
            const imageFileUri = await getTrickplayTileFileUri({
                itemId: props.item.Id!,
                width: 320,
                index: 1,
            });

            if (imageFileUri) {
                // The getTrickplayTileFileUri function already handles caching
                setImageUri(imageFileUri);
            }

            setBusy(false);
        } catch (e) {
            setBusy(false);
            toast.error('Failed to load trick play images.', e);
        }
    }, [props.item]);

    useEffect(() => {
        // TODO: Calculate horizontal and vertical offsets based on percentagePosition
    }, [props.percentagePosition]);

    return {
        imageUri,
        isBusy,
    };
}

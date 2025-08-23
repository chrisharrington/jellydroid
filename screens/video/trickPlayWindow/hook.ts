import { useJellyfin } from '@/hooks/jellyfin';
import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { TrickPlayWindowProps } from '.';

export function useTrickPlayWindow(props: TrickPlayWindowProps) {
    const { getTrickplayTileFileUri } = useJellyfin(),
        [horizontalOffset, setHorizontalOffset] = useState<number>(0),
        [verticalOffset, setVerticalOffset] = useState<number>(0),
        [imageUri, setImageUri] = useState<string | null>(null),
        { width } = useWindowDimensions();

    useEffect(() => {
        if (!props.item.RunTimeTicks) return;

        // Constants.
        const TICKS_PER_SECOND = 10_000_000,
            SECONDS_PER_TRICKPLAY_IMAGE = 10,
            IMAGES_PER_SPRITE_SHEET = 100,
            SPRITE_SHEET_COLUMNS = 10,
            IMAGE_WIDTH = 320,
            IMAGE_HEIGHT = 132;

        // Calculate total video duration in seconds.
        const totalSeconds = props.item.RunTimeTicks / TICKS_PER_SECOND;

        // Calculate current position in seconds based on percentage.
        const currentSeconds = (props.percentagePosition / 100) * totalSeconds;

        // Calculate which trickplay image index this corresponds to.
        const imageIndex = Math.floor(currentSeconds / SECONDS_PER_TRICKPLAY_IMAGE);

        // Calculate which sprite sheet this image is in.
        const spriteSheetIndex = Math.floor(imageIndex / IMAGES_PER_SPRITE_SHEET);

        // Calculate position within the sprite sheet (0-99).
        const positionInSheet = imageIndex % IMAGES_PER_SPRITE_SHEET;

        // Calculate row and column within the sprite sheet.
        const column = positionInSheet % SPRITE_SHEET_COLUMNS,
            row = Math.floor(positionInSheet / SPRITE_SHEET_COLUMNS);

        // Calculate horizontal and vertical offsets.
        const calculatedHorizontalOffset = column * IMAGE_WIDTH * -1,
            calculatedVerticalOffset = row * IMAGE_HEIGHT * -1;

        // Update the offset states.
        setHorizontalOffset(calculatedHorizontalOffset);
        setVerticalOffset(calculatedVerticalOffset);
        setImageUri(getTrickplayTileFileUri(props.item, spriteSheetIndex));
    }, [props.percentagePosition, props.item.RunTimeTicks]);

    return {
        imageUri,
        horizontalOffset,
        verticalOffset,
        screenWidth: width,
    };
}

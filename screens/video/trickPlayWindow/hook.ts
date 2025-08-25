import { useAsyncEffect } from '@/hooks/asyncEffect';
import { useJellyfin } from '@/hooks/jellyfin';
import { useState } from 'react';
import { Image, useWindowDimensions } from 'react-native';
import { TrickPlayWindowProps } from '.';

const TICKS_PER_SECOND = 10_000_000;

export function useTrickPlayWindow(props: TrickPlayWindowProps) {
    const { getTrickplayTileFileUri, getSystemConfig } = useJellyfin(),
        [horizontalOffset, setHorizontalOffset] = useState<number>(0),
        [verticalOffset, setVerticalOffset] = useState<number>(0),
        [imageUri, setImageUri] = useState<string | null>(null),
        { width } = useWindowDimensions(),
        [spriteSheetSize, setSpriteSheetSize] = useState<{ width: number; height: number } | null>(null);

    useAsyncEffect(async () => {
        if (!props.item.RunTimeTicks) return;

        // Pull the Jellyfin config to determine the trickplay settings.
        const config = await getSystemConfig(),
            interval = config.TrickplayOptions.Interval / 1000,
            imagesPerSpriteSheet = config.TrickplayOptions.TileWidth * config.TrickplayOptions.TileHeight;

        // Calculate total video duration in seconds.
        const totalSeconds = props.item.RunTimeTicks / TICKS_PER_SECOND;

        // Calculate current position in seconds based on percentage.
        const currentSeconds = (props.percentagePosition / 100) * totalSeconds;

        // Calculate which trickplay image index this corresponds to.
        const imageIndex = Math.floor(currentSeconds / interval);

        // Calculate which sprite sheet this image is in.
        const spriteSheetIndex = Math.floor(imageIndex / imagesPerSpriteSheet);

        // Generate the trickplay sprite sheet URI.
        const spriteSheetUri = getTrickplayTileFileUri(props.item, spriteSheetIndex);

        // Calculate position within the sprite sheet (0-99).
        const positionInSheet = imageIndex % imagesPerSpriteSheet;

        // Calculate row and column within the sprite sheet.
        const column = positionInSheet % config.TrickplayOptions.TileWidth,
            row = Math.floor(positionInSheet / config.TrickplayOptions.TileWidth);

        // Derive the size of the sprite sheet and calculate image width and height.
        const size = await Image.getSize(spriteSheetUri);
        setSpriteSheetSize(size);

        // Calculate horizontal and vertical offsets.
        const calculatedHorizontalOffset = config.TrickplayOptions.TileWidth * column * -1,
            calculatedVerticalOffset = config.TrickplayOptions.TileHeight * row * -1;

        // Update the offset states.
        setHorizontalOffset(calculatedHorizontalOffset);
        setVerticalOffset(calculatedVerticalOffset);

        // Set the image URI to be the file trickplay URI.
        setImageUri(spriteSheetUri);
    }, [props.percentagePosition, props.item.RunTimeTicks, getTrickplayTileFileUri]);

    return {
        imageUri,
        horizontalOffset,
        verticalOffset,
        screenWidth: width,
        spriteSheetSize,
    };
}

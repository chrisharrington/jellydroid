import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTrickPlayWindow } from './hook';
import style from './style';

export type TrickPlayWindowProps = {
    /** Required. Controls the visibility of the trick play window. */
    isVisible: boolean;

    /** Required. Media item containing metadata for the current video. */
    item: BaseItemDto;

    /** Required. Current playback position as a percentage (0-100). */
    percentagePosition: number;
};

export function TrickplayWindow(props: TrickPlayWindowProps) {
    const { imageUri, horizontalOffset, verticalOffset, screenWidth, spriteSheetSize } = useTrickPlayWindow(props);

    return (
        props.isVisible && (
            <View
                style={[
                    style.thumbPanel,
                    {
                        // The magic numbers here are based on the position of the Slider used to seek.
                        left: Math.max(
                            55,
                            Math.min(screenWidth - 320 - 94, (props.percentagePosition / 100) * (screenWidth - 140))
                        ),
                        transform: [
                            {
                                translateX: -40,
                            },
                        ],
                    },
                    spriteSheetSize && { aspectRatio: spriteSheetSize.width / spriteSheetSize.height },
                ]}
            >
                {imageUri && (
                    <Image
                        source={imageUri}
                        style={[
                            style.trickPlayImage,
                            spriteSheetSize && {
                                aspectRatio: spriteSheetSize.width / spriteSheetSize.height,
                            },
                            {
                                transform: [
                                    { translateX: `${horizontalOffset}%` },
                                    { translateY: `${verticalOffset}%` },
                                ],
                            },
                        ]}
                    />
                )}
            </View>
        )
    );
}

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

    /** Required. The width of the trickplay window. */
    width: number;
};

export function TrickplayWindow(props: TrickPlayWindowProps) {
    const { imageUri, horizontalOffset, verticalOffset, spriteSheetSize } = useTrickPlayWindow(props);

    return (
        props.isVisible && (
            <View
                style={[
                    style.thumbPanel,
                    spriteSheetSize && { aspectRatio: spriteSheetSize.width / spriteSheetSize.height },
                    { width: props.width },
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
                                width: props.width * 10,
                            },
                        ]}
                    />
                )}
            </View>
        )
    );
}

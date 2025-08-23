import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTrickPlayWindow } from './hook';
import style from './style';

export type TrickPlayWindowProps = {
    isVisible: boolean;
    item: BaseItemDto;
    percentagePosition: number;
};

export function TrickplayWindow(props: TrickPlayWindowProps) {
    const { imageUri, horizontalOffset, verticalOffset, screenWidth } = useTrickPlayWindow(props);

    console.log('Trickplay Window:', props.percentagePosition, (props.percentagePosition / 100) * screenWidth);

    return (
        props.isVisible && (
            <View
                style={[
                    style.thumbPanel,
                    {
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
                ]}
            >
                {imageUri && (
                    <Image
                        source={imageUri}
                        style={[
                            style.trickPlayImage,
                            {
                                transform: [{ translateX: horizontalOffset }, { translateY: verticalOffset }],
                            },
                        ]}
                    />
                )}
            </View>
        )
    );
}

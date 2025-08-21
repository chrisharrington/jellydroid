import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
// import { Image } from 'expo-image';
import Spinner from '@/components/spinner';
import { Image, View } from 'react-native';
import { useTrickPlayWindow } from './hook';
import style from './style';

export type TrickPlayWindowProps = {
    isVisible: boolean;
    item: BaseItemDto;
    percentagePosition: number;
};

export function TrickPlayWindow(props: TrickPlayWindowProps) {
    const { imageUri, isBusy } = useTrickPlayWindow(props);

    return (
        props.isVisible && (
            <View
                style={[
                    style.thumbPanel,
                    {
                        left: `${props.percentagePosition}%`,
                        transform: [{ translateX: -40 }],
                    },
                ]}
            >
                {isBusy ? <Spinner /> : imageUri && <Image src={imageUri} style={style.trickPlayImage} />}
            </View>
        )
    );
}

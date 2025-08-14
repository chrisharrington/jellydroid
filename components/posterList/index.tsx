import { SubHeader } from '@/subHeader';
import { PropsWithChildren } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Poster from '../poster';
import { usePosterList } from './hook';
import style from './style';

export type PosterListProps<TListItem> = PropsWithChildren & {
    title: string;
    items: TListItem[];
    itemSubtext: (item: TListItem) => string;
    itemPosterUrl: (item: TListItem) => string;
    keyExtractor: (item: TListItem) => string;
    onPressItem: (item: TListItem) => void;
};

export function PosterList<TListItem>(props: PosterListProps<TListItem>) {
    const { getImageForId } = usePosterList();

    return (
        <View>
            <View style={{ marginBottom: 8 }}>
                <SubHeader>{props.title}</SubHeader>
            </View>

            <FlatList
                data={props.items}
                keyExtractor={props.keyExtractor}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <Pressable
                        style={[style.poster, { marginRight: index === props.items.length - 1 ? 0 : 18 }]}
                        onPress={() => props.onPressItem(item)}
                    >
                        <Poster url={getImageForId(props.itemPosterUrl(item))} />
                        <Text style={style.label}>{props.itemSubtext(item)}</Text>
                    </Pressable>
                )}
            />
        </View>
    );
}

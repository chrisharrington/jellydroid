import { Section } from '@/screens/home/section';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { FlatList, TouchableOpacity } from 'react-native';
import Poster from '../poster';
import style from './style';

export type ItemSectionProps = {
    /** Required. The label for the item list. */
    label: string;

    /** Required. The list of items to display. */
    items: BaseItemDto[];

    /** Required. The action to perform when an item is selected. */
    onItemSelected: (item: BaseItemDto) => Promise<void> | void;
};

export function ItemSection(props: ItemSectionProps) {
    return (
        <Section {...props}>
            <FlatList
                data={props.items}
                keyExtractor={item => item.Id as string}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={[style.item, { marginRight: index === props.items.length - 1 ? 0 : 18 }]}
                        onPress={() => props.onItemSelected(item)}
                    >
                        <Poster
                            url={`${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`}
                        />
                    </TouchableOpacity>
                )}
            />
        </Section>
    );
}

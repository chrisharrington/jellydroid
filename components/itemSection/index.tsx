import { Section } from '@/screens/home/section';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Poster from '../poster';
import style from './style';

export type ItemSectionProps = {
    /** Required. The label for the item list. */
    label: string;

    /** Required. The list of items to display. */
    items: BaseItemDto[];

    /** Required. The action to perform when an item is selected. */
    onItemSelected: (item: BaseItemDto) => Promise<void> | void;

    /** Optional. A flag indicating that each item poster should display a progress indicator. Defaults to false. */
    withProgressIndicator?: boolean;
};

export function ItemSection(props: ItemSectionProps) {
    if (props.withProgressIndicator) console.log(props.items[0].UserData?.PlayedPercentage);

    return (
        <Section {...props}>
            <FlatList
                data={props.items}
                keyExtractor={item => item.Id as string}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        style={[style.item, { marginRight: index === props.items.length - 1 ? 0 : 18 }]}
                        onPress={() => props.onItemSelected(item)}
                    >
                        <View style={style.posterContainer}>
                            <Poster
                                url={`${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`}
                            />

                            {props.withProgressIndicator && (
                                <View style={style.itemProgressContainer}>
                                    <View
                                        style={[
                                            style.itemProgress,
                                            { width: `${item.UserData?.PlayedPercentage || 0}%` },
                                        ]}
                                    />
                                </View>
                            )}
                        </View>

                        <Text numberOfLines={1} style={style.title}>
                            {item.Name}
                        </Text>

                        <Text style={style.year}>{item.ProductionYear}</Text>
                    </TouchableOpacity>
                )}
            />
        </Section>
    );
}

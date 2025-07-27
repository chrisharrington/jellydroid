import { Section, SectionProps } from '@/screens/home/section';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { FlatList, Text, View } from 'react-native';
import Poster from '../poster';
import styles from './style';

type MovieSectionProps = Omit<SectionProps, 'children'> & {
    movies: BaseItemDto[];
};

export function MovieSection(props: MovieSectionProps) {
    return (
        <Section {...props}>
            <FlatList
                data={props.movies}
                keyExtractor={item => item.Id as string}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <View style={[styles.item, { marginRight: index === props.movies.length - 1 ? 0 : 18 }]}>
                        <Poster
                            url={`${process.env.EXPO_PUBLIC_JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${process.env.EXPO_PUBLIC_JELLYFIN_API_KEY}`}
                        />

                        <Text numberOfLines={1} style={styles.title}>
                            {item.Name}
                        </Text>

                        <Text style={styles.year}>{item.ProductionYear}</Text>
                    </View>
                )}
            />
        </Section>
    );
}

import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Text, View } from 'react-native';
import { useInfoTable } from './hook';
import styles from './style';

export type InfoTableProps = {
    item: BaseItemDto;
};

export function InfoTable({ item }: InfoTableProps) {
    const { genres, director, writers, video, audio } = useInfoTable({ item });

    return (
        <View style={styles.container}>
            <InfoEntry label='🎭  Genres' value={genres} />
            <InfoEntry label='🎬  Director' value={director} />
            <InfoEntry label='✍️  Writers' value={writers} />
            <InfoEntry label='📹  Video' value={video} />
            <InfoEntry label='🔊  Audio' value={audio} />
        </View>
    );
}

function InfoEntry({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        value && (
            <View style={styles.entry}>
                <Text style={styles.entryLabel}>{label}</Text>
                <Text style={styles.entryValue}>{value}</Text>
            </View>
        )
    );
}

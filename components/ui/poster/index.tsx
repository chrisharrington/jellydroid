import React from 'react';
import { Image, View } from 'react-native';
import styles from './style';

export type PosterProps = {
    url: string;
};

/**
 * Poster component displays a movie poster image at standard proportions.
 *
 * @property url - Required. The image URL to display.
 */
export function Poster({ url }: PosterProps) {
    return (
        <View style={styles.container}>
            <Image source={{ uri: url }} style={styles.image} />
        </View>
    );
}

export default Poster;

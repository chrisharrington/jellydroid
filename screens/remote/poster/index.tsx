import React, { useEffect } from 'react';
import { Animated, Image } from 'react-native';
import { usePoster } from './hook';
import style from './style';

export type PosterProps = {
    /** Required. The URI of the poster image to display. */
    poster: string | null;

    /** Required. Controls the opacity animation - true for dimmed (0.3), false for full opacity (1). */
    isDimmed: boolean;
};

/**
 * Poster component that displays a movie/show poster with animated opacity transitions.
 * The opacity smoothly transitions between full (1.0) and dimmed (0.3) states.
 */
export function Poster(props: PosterProps) {
    const { opacity } = usePoster(props);

    // Animate opacity when dimmed state changes.
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: props.isDimmed ? 0.3 : 1,
            duration: 150,
            useNativeDriver: true,
        }).start();
    }, [props.isDimmed, opacity]);

    return (
        <Animated.View style={[style.posterContainer, { opacity }]}>
            {props.poster && <Image source={{ uri: props.poster }} style={style.poster} />}
        </Animated.View>
    );
}

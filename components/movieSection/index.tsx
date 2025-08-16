import { SectionProps } from '@/screens/home/section';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ItemSection } from '../itemSection';
import { useMovieSection } from './hook';

type MovieSectionProps = Omit<SectionProps, 'children'> & {
    /** Required. The list of movies to display. */
    movies: BaseItemDto[];
};

export function MovieSection(props: MovieSectionProps) {
    const { navigateToMovieDetails } = useMovieSection();

    return <ItemSection label={props.label} items={props.movies} onItemSelected={navigateToMovieDetails} />;
}

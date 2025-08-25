import { SectionProps } from '@/screens/home/section';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { ItemSection } from '../itemSection';
import { useTvSection } from './hook';

type TvSectionProps = Omit<SectionProps, 'children'> & {
    /** Required. The list of TV episodes to display. */
    episodes: BaseItemDto[];

    /** Optional. A flag indicating that each item poster should display a progress indicator. Defaults to false. */
    withProgressIndicator?: boolean;
};

export function TvSection(props: TvSectionProps) {
    const { navigateToTvShowDetails } = useTvSection();

    return (
        <ItemSection
            label={props.label}
            items={props.episodes}
            onItemSelected={navigateToTvShowDetails}
            withProgressIndicator={props.withProgressIndicator}
        />
    );
}

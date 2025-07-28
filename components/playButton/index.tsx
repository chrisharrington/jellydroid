import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Button, ButtonProps } from '../button';
import { usePlayButton } from './hook';

export type PlayButtonProps = Omit<ButtonProps, 'onPress'> & {
    item: BaseItemDto;
};

export function PlayButton(props: PlayButtonProps) {
    const { handlePress } = usePlayButton(props);
    return <Button {...props} onPress={handlePress} />;
}

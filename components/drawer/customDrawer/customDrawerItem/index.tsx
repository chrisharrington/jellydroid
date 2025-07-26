import { AnimatedPressable } from '@/components/ui/AnimatedPressable/index';
import { Text } from 'react-native';
import { useCustomDrawerItem } from './hook';
import styles from './style';

/**
 * Props for the CustomDrawerItem component.
 *
 * @property label - The display text for the drawer item.
 * @property path - The navigation path associated with the drawer item.
 * @property icon - A render function that returns the icon for the drawer item.
 */
export type CustomDrawerItemProps = {
    label: string;
    path: string;
    icon: (props: { focused: boolean; size: number; color: string }) => React.ReactNode;
};

/**
 * CustomDrawerItem component renders a single item in the custom drawer.
 *
 * @param props - Props containing label, path, and icon render function.
 * @returns A DrawerItem configured with navigation and icon.
 */
export function CustomDrawerItem(props: CustomDrawerItemProps) {
    const { navigate } = useCustomDrawerItem(props);
    return (
        <AnimatedPressable style={styles.item} onPress={navigate}>
            {props.icon({ focused: false, size: 24, color: '#000' })}
            <Text style={styles.label}>{props.label}</Text>
        </AnimatedPressable>
    );
}

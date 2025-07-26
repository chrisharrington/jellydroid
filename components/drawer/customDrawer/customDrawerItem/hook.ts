import { useRouter } from 'expo-router';
import { CustomDrawerItemProps } from '.';

export function useCustomDrawerItem(props: CustomDrawerItemProps) {
    const router = useRouter();

    return { navigate: () => router.push(props.path as any) };
}

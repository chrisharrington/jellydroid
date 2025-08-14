import { Colours } from '@/constants/colours';
import { PropsWithChildren } from 'react';
import { Text } from 'react-native';

export function SubHeader({ children }: PropsWithChildren) {
    return (
        <Text
            style={{
                fontWeight: 'bold',
                fontSize: 18,
                color: Colours.subtext,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontFamily: 'Lato',
            }}
        >
            {children}
        </Text>
    );
}

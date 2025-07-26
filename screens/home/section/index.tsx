import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';
import style from './style';

export type SectionProps = PropsWithChildren & {
    label: string;
    path?: string;
};

export function Section({ label, children }: SectionProps) {
    return (
        <View style={style.container}>
            <View style={style.labelContainer}>
                <Text style={style.label}>{label}</Text>
            </View>
            <View style={style.childrenContainer}>{children}</View>
        </View>
    );
}

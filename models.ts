export type LabelValue = {
    value: string | null;
    label: string;
};

export type JellyfinConfig = {
    TrickplayOptions: {
        // The interval between trick play images in milliseconds.
        Interval: number;

        // The number of columns in the trick play sheet.
        TileWidth: number;

        // The number of rows in the trick play sheet.
        TileHeight: number;
    };
};

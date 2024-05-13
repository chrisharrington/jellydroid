import { useContext, useEffect } from 'react';
import { View } from 'react-native';
import { JellyfinContext } from '../data/jellyfin/context';

export default function Home() {
    const jellyfin = useContext(JellyfinContext);

    useEffect(() => {
        (async () => {
            const views = await jellyfin.getUserViews();
            await jellyfin.getLatest(views[0].id);

            // const discoveryManager = GoogleCast.getDiscoveryManager();
            // discoveryManager.onDevicesUpdated(devices => console.log('deviecs', devices));
            // await discoveryManager.getDevices().then(devices => console.log('devices', devices));
        })();
    }, []);

    return <View style={{ paddingTop: 100, paddingLeft: 20 }}>
    </View>;
}
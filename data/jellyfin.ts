import { Jellyfin as NativeJellyfin } from '@jellyfin/sdk';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { EXPO_PUBLIC_DEFAULT_SERVER } from '@env';

export class Jellyfin {
    private jellyfin: NativeJellyfin;

    constructor() {
        this.jellyfin = new NativeJellyfin({
            clientInfo: {
                name: 'Jellydroid',
                version: '1.0.0'
            },
            deviceInfo: {
                name: Device.modelId || Device.modelName || Device.deviceName || 'Device Name',
                id: Application.applicationId || new Date().getTime().toString()
            }
        });
    }

    public async init() {
        console.log('Getting recommended servers...');
        const servers = await this.jellyfin.discovery.getRecommendedServerCandidates(EXPO_PUBLIC_DEFAULT_SERVER);
        console.log('Servers:', servers);
    }
}
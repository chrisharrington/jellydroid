import { Api, Jellyfin as NativeJellyfin } from '@jellyfin/sdk';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getVideosApi } from '@jellyfin/sdk/lib/utils/api/videos-api';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { EXPO_PUBLIC_DEFAULT_SERVER, EXPO_PUBLIC_JELLYFIN_USERNAME, EXPO_PUBLIC_JELLYFIN_PASSWORD } from '@env';
import { ImageType, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import { Latest, UserView } from './models';

export class Jellyfin {
    /** The underlying Jellyfin API client. */
    private jellyfin: NativeJellyfin;

    /** The generated API connection object used to make requests. */
    private api: Api | undefined;

    /** The signed in user. */
    private user: UserDto | undefined;

    /** A promise representing when the API has been initialized. */
    public initialized: Promise<void>;

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

        this.initialized = this.init();
    }

    /**
     * Initializes the underlying connection to the Jellyfin server, taking care of authenticating the user according
     * to EXPO_PUBLIC_JELLYFIN_USERNAME and EXPO_PUBLIC_JELLYFIN_PASSWORD.
     */
    private async init() {
        console.log('Getting recommended servers...');
        const servers = await this.jellyfin.discovery.getRecommendedServerCandidates(EXPO_PUBLIC_DEFAULT_SERVER);

        console.log('Selecting best server...');
        const best = this.jellyfin.discovery.findBestServer(servers);

        console.log(`Connecting to ${best?.address}...`)
        this.api = this.jellyfin.createApi(best?.address || '');

        console.log('Authorizing...');
        const auth = await this.api.authenticateUserByName(EXPO_PUBLIC_JELLYFIN_USERNAME, EXPO_PUBLIC_JELLYFIN_PASSWORD);

        console.log('Authorized.');

        this.user = auth.data.User;
    }

    /**
     * Retrieves a list of views associated with the signed in user.
     * @returns The list of user views.
     */
    public async getUserViews(): Promise<UserView[]> {
        try {
            console.log('Getting user views...');
            await this.initialized;

            if (!this.api)
                throw new Error('Missing API.');
            if (!this.user?.Id)
                throw new Error('Missing user ID.');

            const views = (await getUserViewsApi(this.api).getUserViews({ userId: this.user.Id })).data.Items?.map(item => ({ id: item.Id as string, name: item.Name as string })) as UserView[];
            console.log('User views ->', views);

            return views;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    public async getLatest(parentId: string) : Promise<Latest[]> {
        try {
            console.log(`Getting latest for parent ${parentId}...`);
            await this.initialized;

            if (!this.api)
                throw new Error('Missing API.');
            if (!this.user?.Id)
                throw new Error('Missing user ID.');

            const latest = await getUserLibraryApi(this.api).getLatestMedia({ userId: this.user?.Id, parentId });
            console.log(`Latest for parent ${parentId} ->`, JSON.stringify(latest.data));

            return latest.data.map(l => ({
                id: l.Id as string,
                name: l.Name as string,
                year: l.ProductionYear?.toString(),
                imageUri: this.api?.getItemImageUrl(l.Id as string, ImageType.Primary)
            })) as Latest[];
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}
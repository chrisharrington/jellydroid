/// <reference types="expo" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_APP_NAME: string;
    readonly EXPO_PUBLIC_APP_VERSION: string;
    readonly EXPO_PUBLIC_JELLYFIN_URL: string;
    readonly EXPO_PUBLIC_JELLYFIN_API_KEY: string;
  }
}

/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `/movie/[name]/[id]`, params: Router.UnknownInputParams & { name: string | number;id: string | number; } } | { pathname: `/remote/[itemId]/[mediaSourceId]`, params: Router.UnknownInputParams & { itemId: string | number;mediaSourceId: string | number; } } | { pathname: `/video/[itemId]/[mediaSourceId]`, params: Router.UnknownInputParams & { itemId: string | number;mediaSourceId: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `/movie/[name]/[id]`, params: Router.UnknownOutputParams & { name: string;id: string; } } | { pathname: `/remote/[itemId]/[mediaSourceId]`, params: Router.UnknownOutputParams & { itemId: string;mediaSourceId: string; } } | { pathname: `/video/[itemId]/[mediaSourceId]`, params: Router.UnknownOutputParams & { itemId: string;mediaSourceId: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | `/movie/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | `/remote/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | `/video/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | { pathname: `/movie/[name]/[id]`, params: Router.UnknownInputParams & { name: string | number;id: string | number; } } | { pathname: `/remote/[itemId]/[mediaSourceId]`, params: Router.UnknownInputParams & { itemId: string | number;mediaSourceId: string | number; } } | { pathname: `/video/[itemId]/[mediaSourceId]`, params: Router.UnknownInputParams & { itemId: string | number;mediaSourceId: string | number; } };
    }
  }
}

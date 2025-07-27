/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}/movie/[name]/[id]` | `/movie/[name]/[id]`, params: Router.UnknownInputParams & { name: string | number;id: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}/movie/[name]/[id]` | `/movie/[name]/[id]`, params: Router.UnknownOutputParams & { name: string;id: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | `${'/(drawer)'}/movie/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | `/movie/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}${`?${string}` | `#${string}` | ''}` | { pathname: `${'/(drawer)'}/movie/[name]/[id]` | `/movie/[name]/[id]`, params: Router.UnknownInputParams & { name: string | number;id: string | number; } };
    }
  }
}

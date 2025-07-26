/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}/hook` | `/hook`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}` | `/`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}/hook` | `/hook`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}` | `/`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${'/(home)'}/hook${`?${string}` | `#${string}` | ''}` | `/hook${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${'/(home)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}/hook` | `/hook`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}${'/(home)'}` | `/`; params?: Router.UnknownInputParams; };
    }
  }
}

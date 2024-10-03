import type {Cookie} from '@std/http/cookie';
import type {Handle as VHandle, Router as VRouter} from '@ssr/velocirouter';

/** Cookie map */
export type CookieMap = Map<string, Cookie>;

/** Router platform */
export type Platform = {
  info: Deno.ServeHandlerInfo;
  cookies: CookieMap;
  deployHash: string;
  platformProps: Record<string, unknown>;
};

/** Router handle */
export type Handle = VHandle<Platform>;

/** Router instance */
export type Router = VRouter<Platform>;

/** Hyperssr instance options */
export type Options = {
  deployHash?: string;
  dev?: boolean;
  origin?: URL;
  serve?: Deno.ServeOptions;
  static?: string;
  rejectionHandled?: (error: PromiseRejectionEvent) => void;
  unhandledRejection?: (error: PromiseRejectionEvent) => void;
};

/** Hyperssr route */
export type Route = {
  hash: string;
  pattern: string;
  order?: number;
};

/** Hyperssr manifest */
export type Manifest = {
  deployHash: string;
  routes: Array<Route>;
};

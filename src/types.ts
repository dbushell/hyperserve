import type {Cookie} from '@std/http/cookie';
import type {
  Handle as VHandle,
  Method,
  Router as VRouter
} from '@ssr/velocirouter';

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
  rejectionHandled?: (error: PromiseRejectionEvent) => void;
  unhandledRejection?: (error: PromiseRejectionEvent) => void;
};

/** Hyperssr render */
export type Render = (
  ...args: Parameters<Handle>
) => ReturnType<Handle> | Promise<ReturnType<Handle>>;

/** Hyperssr route */
export type Route = {
  hash: string;
  method: Method;
  pattern: string;
  render: Render;
  order?: number;
};

/** Hyperssr manifest */
export type Manifest = {
  deployHash: string;
  routes: Array<Route>;
};

import type {Cookie} from '@std/http/cookie';
import type * as VelociRouter from '@ssr/velocirouter';
import type {Props} from '@dbushell/hypermore';

/** Cookie map */
export type CookieMap = Map<string, Cookie>;

/** Router platform */
export type Platform = {
  info: Deno.ServeHandlerInfo;
  cookies: CookieMap;
  deployHash: string;
  globalProps: Props;
};

/** Router handle */
export type Handle = VelociRouter.Handle<Platform>;

/** Router instance */
export type Router = VelociRouter.Router<Platform>;

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

/** Hyperssr route load props */
export type RouteLoadProps = Platform & {
  fetch: typeof fetch;
  params?: Record<string, string | undefined>;
  request: Request;
};

/** Hyperssr route module */
export type RouteModule = {
  pattern?: string;
  load?: (props: RouteLoadProps) => Promise<Response | void>;
};

/** Hyperssr route */
export type Route = {
  hash: string;
  method: VelociRouter.Method;
  pattern: string;
  render: Render;
  order?: number;
  load?: (props: RouteLoadProps) => Promise<Response | void>;
};

/** Hyperssr manifest */
export type Manifest = {
  deployHash: string;
  routes: Array<Route>;
};

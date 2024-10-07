import type {Cookie} from '@std/http/cookie';
import type * as VelociRouter from '@ssr/velocirouter';
import type {Props} from '@dbushell/hypermore';

/** Router platform */
export type Platform = {
  info: Deno.ServeHandlerInfo;
  cookies: Map<string, Cookie>;
  deployHash: string;
  globalProps: Props;
};

/** Router handle */
export type Handle = VelociRouter.Handle<Platform>;

/** Router instance */
export type Router = VelociRouter.Router<Platform>;

/** Hyperserve instance options */
export type Options = {
  deployHash?: string;
  dev?: boolean;
  origin?: URL;
  serve?: Deno.ServeOptions;
  rejectionHandled?: (error: PromiseRejectionEvent) => void;
  unhandledRejection?: (error: PromiseRejectionEvent) => void;
};

/** Hyperserve render */
export type Render = (
  ...args: Parameters<Handle>
) => ReturnType<Handle> | Promise<ReturnType<Handle>>;

/** Hyperserve route load props */
export type RouteLoadProps = Platform & {
  fetch: typeof fetch;
  params?: Record<string, string | undefined>;
  request: Request;
};

/** Hyperserve route module */
export type RouteModule = {
  pattern?: string;
  load?: (props: RouteLoadProps) => Promise<Response | void>;
};

/** Hyperserve route */
export type Route = {
  hash: string;
  method: VelociRouter.Method;
  pattern: string;
  render: Render;
  order?: number;
  load?: (props: RouteLoadProps) => Promise<Response | void>;
};

/** Hyperserve manifest */
export type Manifest = {
  deployHash: string;
  routes: Array<Route>;
};

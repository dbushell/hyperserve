import type {Cookie} from '@std/http/cookie';
import type {Handle, Method} from '@ssr/velocirouter';
import type {Props} from '@dbushell/hypermore';

/** Router platform */
export type HyperPlatform = {
  info: Deno.ServeHandlerInfo;
  cookies: Map<string, Cookie>;
  deployHash: string;
  platformProps: Props;
};

/** Hyperserve handle */
export type HyperHandle = Handle<HyperPlatform>;

/** Hyperserve instance options */
export type HyperOptions = {
  deployHash?: string;
  dev?: boolean;
  origin?: URL;
  static?: string;
  serve?: Deno.ServeOptions;
  rejectionHandled?: (error: PromiseRejectionEvent) => void;
  unhandledRejection?: (error: PromiseRejectionEvent) => void;
};

/** Hyperserve render response */
export type RenderResponse = {
  response: ReturnType<HyperHandle>;
};

/** Hyperserve render function */
export type RenderFunction = (
  ...args: Parameters<HyperHandle>
) => RenderResponse | Promise<RenderResponse>;

/** Hyperserve route load props */
export type RouteLoadProps = HyperPlatform & {
  fetch: typeof fetch;
  params?: Record<string, string | undefined>;
  request: Request;
};

/** Hyperserve route module */
export type RouteModule = {
  load?: (props: RouteLoadProps) => Promise<Response | void>;
  order?: number;
  pattern?: string;
  DELETE?: HyperHandle;
  GET?: HyperHandle;
  PATCH?: HyperHandle;
  POST?: HyperHandle;
  PUT?: HyperHandle;
};

/** Hyperserve route */
export type Route = {
  hash: string;
  method: Method;
  pattern: string;
  render: RenderFunction;
  order?: number;
  load?: (props: RouteLoadProps) => Promise<Response | void>;
};

/** Hyperserve manifest */
export type HyperManifest = {
  deployHash: string;
  routes: Array<Route>;
};

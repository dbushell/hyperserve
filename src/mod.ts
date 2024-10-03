import type {Manifest, Options, Platform, Router} from './types.ts';
import {Router as VelociRouter} from '@ssr/velocirouter';
import * as path from '@std/path';
import {Hypermore} from './deps.ts';
import Cookies from './cookies.ts';
import {encodeHash} from './utils.ts';
import * as middleware from './middleware/mod.ts';

export class Hyperssr {
  #initialized = false;
  #dir: string;
  #hypermore!: Hypermore;
  #manifest!: Manifest;
  #options: Options;
  #router!: Router;
  #server!: Deno.HttpServer;

  constructor(dir?: string, options: Options = {}) {
    // Ensure absolute path
    this.#dir = path.resolve(dir ?? Deno.cwd(), './');
    // Setup options
    const defaultOptions: Options = {
      origin: Deno.env.has('ORIGIN')
        ? new URL(Deno.env.get('ORIGIN')!)
        : undefined,
      static: 'static',
      unhandledRejection: (error: PromiseRejectionEvent) => {
        error.preventDefault();
        console.error(error.reason);
      },
      rejectionHandled: (error: PromiseRejectionEvent) => {
        error.preventDefault();
        console.error(error.reason);
      }
    };
    this.#options = {
      ...defaultOptions,
      ...(options ?? {})
    };
  }

  get dev(): boolean {
    return this.options.dev ?? false;
  }

  get dir(): string {
    return this.#dir;
  }

  get deployHash(): string {
    return this.manifest.deployHash;
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  get manifest(): Manifest {
    return this.#manifest;
  }

  get options(): Options {
    return this.#options;
  }

  get origin(): URL | undefined {
    return this.options.origin;
  }

  get router(): Router {
    if (!this.initialized) throw new Error('Not initialized');
    return this.#router;
  }

  get server(): Deno.HttpServer {
    if (!this.initialized) throw new Error('Not initialized');
    return this.#server;
  }

  /** Hash a value with the deploy hash */
  hash(value: string, salt = ''): Promise<string> {
    return encodeHash(value + salt + this.deployHash);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.#initialized = true;

    const start = performance.now();

    globalThis.addEventListener(
      'unhandledrejection',
      this.options.unhandledRejection!
    );
    globalThis.addEventListener(
      'rejectionhandled',
      this.options.rejectionHandled!
    );

    const deployHash = await encodeHash(
      // Use build environment variable
      Deno.env.get('DEPLOY_HASH') ??
        // Use unique startup date
        Date.now().toString()
    );

    this.#manifest = {
      deployHash,
      routes: []
    };

    // this.#hypermore = new Hypermore({});
    this.#router = new VelociRouter<Platform>({
      onError: (error) => {
        console.log(error);
        return new Response(null, {status: 500});
      }
    });

    const builtin = [
      middleware.proxy,
      middleware.static,
      // middleware.manifest,
      // middleware.redirect,
      middleware.cache,
      middleware.policy
    ];
    for (const callback of builtin) {
      await Promise.resolve(callback(this));
    }

    // Setup server
    this.#server = Deno.serve(
      this.options.serve ?? {},
      async (request, info) => {
        const cookies = new Cookies(request.headers);
        const platform: Platform = {
          info,
          cookies,
          deployHash: this.deployHash,
          platformProps: {}
        };
        Object.freeze(platform);
        const response = await this.router.handle(request, platform);
        cookies.headers(response);
        return response;
      }
    );

    this.server.finished.then(() => {
      globalThis.removeEventListener(
        'unhandledrejection',
        this.options.unhandledRejection!
      );
      globalThis.removeEventListener(
        'rejectionhandled',
        this.options.rejectionHandled!
      );
    });

    if (this.dev) {
      const time = (performance.now() - start).toFixed(2);
      console.log(`🚀 Server ${time}ms (${this.deployHash})`);
      if (this.origin) console.log(this.origin.href);
    }
  }
}

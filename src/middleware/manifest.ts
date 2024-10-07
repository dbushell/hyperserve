import type {Route, RouteLoadProps} from '../types.ts';
import type {Hyperserve} from '../mod.ts';
import * as fs from '@std/fs';
import * as path from '@std/path';
import {importRoute} from '../routes.ts';
import {serverFetch} from '../fetch.ts';

export default async (server: Hyperserve) => {
  const routeDir = path.resolve(server.dir, 'routes');
  if (fs.existsSync(routeDir) === false) {
    console.warn(`Missing routes directory: "${routeDir}"`);
    return;
  }
  for await (const entry of fs.walk(routeDir, {
    exts: ['html', 'ssr']
  })) {
    const hash = await server.hash(entry.path);
    let pattern = '/' + path.relative(routeDir, entry.path);
    // Replace non-capturing groups
    pattern = pattern.replaceAll(/\([^\)]+?\)\/?/g, '');
    // Replace named parameters
    pattern = pattern.replaceAll(/\[([^\]]+?)\]/g, ':$1');
    // Remove URL
    pattern = path.dirname(pattern);
    if (pattern.at(-1) !== '/') {
      pattern += '/';
    }
    // Append filename if not index
    if (!/index\./.test(path.basename(entry.path))) {
      pattern += path.basename(entry.path, path.extname(entry.path));
    }
    const html = await Deno.readTextFile(entry.path);
    const mod = await importRoute(html);
    if (mod.pattern) {
      if (/^\.\w+$/.test(mod.pattern)) {
        pattern += mod.pattern;
      } else {
        pattern = path.join(pattern, mod.pattern);
      }
    }
    const render: Route['render'] = async ({request, match, platform}) => {
      // Setup context and props
      // const url = new URL(request.url);
      const params = match?.pathname?.groups ?? {};
      const loadProps: RouteLoadProps = {
        ...platform,
        fetch: serverFetch(request, server.router, platform),
        params: structuredClone(params),
        request
      };
      Object.freeze(loadProps);
      const loadResponse = mod.load ? await mod.load(loadProps) : {};
      if (loadResponse instanceof Response) {
        return {
          response: loadResponse.status === 404 ? undefined : loadResponse
        };
      }
      const headers = new Headers();
      headers.set('content-type', 'text/html; charset=utf-8');
      /** @todo pass url, pattern, and params? */
      const render = await server.hypermore.render(
        html,
        {},
        {
          globalProps: {
            deployHash: platform.deployHash,
            ...platform.globalProps
          }
        }
      );
      return new Response(render, {headers});
    };
    const route: Route = {
      hash,
      pattern,
      render,
      method: 'GET'
    };
    server.manifest.routes.push(route);
    const input = new URLPattern({pathname: route.pattern});
    server.router.get(input, async (props) => {
      const render = await route.render(props);
      let {response} = await Promise.resolve(
        server.router.resolve(props.request, render)
      );
      if (!(response instanceof Response)) {
        return response;
      }
      /** @todo Modify response? */
      return response;
    });
    if (server.dev) {
      console.log(`🪄 ${route.method} → ${route.pattern}`);
    }
  }
};

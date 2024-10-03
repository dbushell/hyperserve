import type {Route} from '../types.ts';
import type {Hyperssr} from '../mod.ts';
import * as fs from '@std/fs';
import * as path from '@std/path';

export default async (server: Hyperssr) => {
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
    const route: Route = {
      hash,
      pattern,
      method: 'GET',
      render: async ({platform}) => {
        /** @todo load function? */
        const headers = new Headers();
        headers.set('content-type', 'text/html; charset=utf-8');
        const render = await server.hypermore.render(html, {
          globalProps: {deployHash: platform.deployHash}
        });
        return new Response(render, {headers});
      }
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

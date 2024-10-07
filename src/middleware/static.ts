import type {Hyperserve} from '../mod.ts';
import * as path from '@std/path';
import {existsSync} from '@std/fs';
import {serveDir} from '@std/http/file-server';

export default (server: Hyperserve) => {
  const staticDir = path.resolve(server.dir, 'static');
  if (!existsSync(staticDir)) {
    console.warn(`Missing static directory: "${staticDir}"`);
    return;
  }
  server.router.get(new URLPattern({}), async ({request}) => {
    const response = await serveDir(request, {
      fsRoot: staticDir,
      quiet: true
    });
    if (response.ok || response.status === 304) {
      return response;
    }
  });
};

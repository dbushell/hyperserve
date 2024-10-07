import type {Hyperserve} from '../mod.ts';
import * as fs from '@std/fs';
import * as path from '@std/path';
import {componentName} from '@dbushell/hypermore';

export default async (server: Hyperserve) => {
  const componentDir = path.resolve(server.dir, 'components');
  if (fs.existsSync(componentDir) === false) {
    console.warn(`Missing components directory: "${componentDir}"`);
    return;
  }
  for await (const entry of fs.walk(componentDir, {
    exts: ['html', 'ssr']
  })) {
    const name = componentName(entry.name);
    if (server.hypermore.hasTemplate(name)) {
      console.warn(`Duplicate component: "${name}"`);
    } else {
      const html = await Deno.readTextFile(entry.path);
      server.hypermore.setTemplate(name, html);
    }
  }
};

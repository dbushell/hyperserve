import type {RouteModule} from './types.ts';
import type {Node} from '@dbushell/hyperless';
import {parseHTML} from '@dbushell/hypermore';

/**
 * Execute code and return module exports
 * @param code JavaScript
 * @returns Module exports
 */
export const importModule = async <T>(code: string): Promise<T> => {
  const blob = new Blob([code], {type: 'text/javascript'});
  const url = URL.createObjectURL(blob);
  const mod = await import(url);
  URL.revokeObjectURL(url);
  return mod as T;
};

/**
 * Import the module script from a route template
 * @param html Route template
 * @returns Route module
 */
export const importRoute = async (html: string): Promise<RouteModule> => {
  const root = parseHTML(html);
  let script: Node | undefined;
  // Find the first top-level <ssr-script context="module">
  for (const node of root.children) {
    if (
      node.tag === 'ssr-script' &&
      node.size === 1 &&
      node.attributes.get('context') === 'module'
    ) {
      script = node;
      break;
    }
  }
  if (!script) return {};
  // Get the code and remove element wrapper
  let code = script.at(0)!.raw;
  code = code.replace(/^\s*<script([^>]*>)/, '');
  code = code.replace(/<\/script>\s*/, '');
  // Import module and remove invalid exports
  const mod = {
    ...(await importModule<RouteModule>(code))
  };
  if (typeof mod.pattern !== 'string') {
    delete mod.pattern;
  }
  if (typeof mod.load !== 'function') {
    delete mod.load;
  }
  return mod;
};
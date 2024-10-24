import type { Hyperserve } from "../mod.ts";
import { requestMap } from "./shared.ts";

/** Default content security policies */
const defaultPolicies = {
  "child-src": ["'self'"],
  "connect-src": ["'self'"],
  "default-src": ["'self'"],
  "frame-src": ["'self'"],
  "font-src": ["'self'"],
  "img-src": ["'self'"],
  "manifest-src": ["'self'"],
  "media-src": ["'self'"],
  "object-src": ["'none'"],
  "prefetch-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "worker-src": ["'self'"],
  "base-uri": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
};

/**
 * Merge default CSP with `x-[policy]` response headers
 */
const getPolicies = (response: Response) => {
  // @ts-ignore: all properties will be set
  const csp: typeof defaultPolicies = {};
  for (const [k, v] of Object.entries(defaultPolicies)) {
    const key = k as keyof typeof defaultPolicies;
    csp[key] = [...v];
    const xkey = `x-${key}`;
    if (response.headers.has(xkey)) {
      const value = response.headers.get(xkey)!;
      response.headers.delete(xkey);
      csp[key].push(...value.split(",").map((s) => `${s.trim()}`));
    }
  }
  // If `unsafe-inline` is present remove nonces and hashes
  if (csp["style-src"].includes(`'unsafe-inline'`)) {
    csp["style-src"] = csp["style-src"].filter(
      (s) => !(s.startsWith(`'nonce-`) || s.startsWith(`'sha256-`)),
    );
  }
  return csp;
};

/**
 * Middleware to handle CSP headers
 */
export default (server: Hyperserve): void => {
  server.router.all(new URLPattern({}), ({ request, response }) => {
    try {
      if (requestMap.get(request)?.ignore) return response;
      if (!response) return;
      const csp = getPolicies(response);
      // Remove redundant policies
      if (csp["default-src"].includes("'self'")) {
        for (const [k, v] of Object.entries(csp)) {
          if (k === "default-src" || !k.endsWith("-src")) continue;
          if (v.length === 1 && v[0] === "'self'") {
            delete csp[k as keyof typeof csp];
          }
        }
      }
      response.headers.set("x-content-type-options", "nosniff");
      response.headers.set("referrer-policy", "same-origin");
      response.headers.set(
        "content-security-policy",
        Object.entries(csp)
          .map(([k, v]) => `${k} ${v.join(" ")}`)
          .join("; "),
      );
    } catch {
      // Headers probably immutable
    }
    return response;
  });
};

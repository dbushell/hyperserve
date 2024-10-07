import type {Hyperssr} from '../mod.ts';
import {requestMap} from './shared.ts';

export default (server: Hyperssr) => {
  server.router.use(({request, response, stopPropagation}) => {
    if (requestMap.get(request)?.ignore) return response;
    if (request.headers.get('upgrade') === 'websocket') {
      requestMap.set(request, {ignore: true});
      return response;
    }
    // Modify request url if behind proxy
    const base = new URL(request.url);
    if (request.headers.has('x-forwarded-host')) {
      base.host = request.headers.get('x-forwarded-host') ?? '';
    }
    if (request.headers.has('x-forwarded-proto')) {
      base.protocol = request.headers.get('x-forwarded-proto') ?? '';
    }
    // Validate against origin url if specified
    if (server.origin) {
      if (
        server.origin.hostname !== base.hostname ||
        server.origin.protocol !== base.protocol
      ) {
        stopPropagation();
        return new Response(null, {status: 404});
      }
    }
    const newRequest = new Request(base, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    return {request: newRequest, response};
  });
};

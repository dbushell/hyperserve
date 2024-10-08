import {assert, assertEquals} from 'jsr:@std/assert';
import {parseHTML} from '@dbushell/hypermore';
import {Hyperserve} from '../mod.ts';

const dir = new URL('./', import.meta.url).pathname;

const origin = new URL(Deno.env.get('ORIGIN') ?? 'http://localhost:8080');

if (Deno.env.has('ORIGIN')) {
  Deno.env.set('DENO_TLS_CA_STORE', 'system');
  const cmd = new Deno.Command('caddy', {
    args: ['run', '--config', 'test/Caddyfile'],
    stdout: 'null',
    stderr: 'null'
  });
  cmd.spawn();
  console.log('Starting caddy proxy...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

const ssr = new Hyperserve(dir, {
  origin,
  dev: true,
  serve: {hostname: '127.0.0.1', port: 8080}
});

await ssr.init();

const headers = new Headers();
headers.append('accept', 'text/html');

Deno.test('200 response', async () => {
  const response = await fetch(origin, {headers});
  await response.body?.cancel();
  assertEquals(response.status, 200);
});

Deno.test('404 response', async () => {
  const response = await fetch(new URL('/fake-path', origin), {headers});
  await response.body?.cancel();
  assertEquals(response.status, 404);
});

Deno.test('404 custom template', async () => {
  const response = await fetch(new URL('/fake-path', origin), {headers});
  const html = await response.text();
  const root = parseHTML(html);
  const node = root.find((n) => n.tag === 'h1');
  assertEquals(node?.children[0]?.toString(), 'Custom 404');
});

Deno.test('500 custom template', async () => {
  const consoleError = console.error;
  console.error = () => {};
  const response = await fetch(new URL('/throw', origin), {headers});
  const html = await response.text();
  const root = parseHTML(html);
  const node = root.find((n) => n.tag === 'h1');
  assertEquals(node?.children[0]?.toString(), 'Custom 500');
  console.error = consoleError;
});

Deno.test('text/html content-type', async () => {
  const response = await fetch(origin, {headers});
  await response.body?.cancel();
  assert(response.headers.get('content-type')?.startsWith('text/html'));
});

Deno.test('<title> rendered', async () => {
  const response = await fetch(origin, {headers});
  const html = await response.text();
  const root = parseHTML(html);
  const node = root.find((n) => n.tag === 'title');
  assertEquals(node?.children[0]?.toString(), 'Test Title');
});

Deno.test('<h1> rendered', async () => {
  const response = await fetch(origin, {headers});
  const html = await response.text();
  const root = parseHTML(html);
  const node = root.find((n) => n.tag === 'h1');
  assertEquals(node?.children[0]?.toString(), 'Test Heading');
});

Deno.test('POST', async (test) => {
  const postURL = new URL('/methods/post', origin);
  await test.step('GET 404', async () => {
    const response = await fetch(postURL, {headers});
    await response.body?.cancel();
    assertEquals(response.status, 404);
  });
  await test.step('POST 200', async () => {
    const response = await fetch(postURL, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        pass: 'Pass!'
      })
    });
    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(data.pass, 'Pass!');
  });
});

Deno.test('DELETE', async (test) => {
  const postURL = new URL('/methods/delete', origin);
  await test.step('GET 404', async () => {
    const response = await fetch(postURL, {headers});
    await response.body?.cancel();
    assertEquals(response.status, 404);
  });
  await test.step('DELETE 200', async () => {
    const response = await fetch(postURL, {
      headers,
      method: 'DELETE'
    });
    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(data.method, 'DELETE');
  });
});

Deno.test('PATCH', async (test) => {
  const postURL = new URL('/methods/patch', origin);
  await test.step('GET 404', async () => {
    const response = await fetch(postURL, {headers});
    await response.body?.cancel();
    assertEquals(response.status, 404);
  });
  await test.step('PATCH 200', async () => {
    const response = await fetch(postURL, {
      headers,
      method: 'PATCH'
    });
    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(data.method, 'PATCH');
  });
});

Deno.test('PUT', async (test) => {
  const postURL = new URL('/methods/put', origin);
  await test.step('GET 404', async () => {
    const response = await fetch(postURL, {headers});
    await response.body?.cancel();
    assertEquals(response.status, 404);
  });
  await test.step('PUT 200', async () => {
    const response = await fetch(postURL, {
      headers,
      method: 'PUT'
    });
    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(data.method, 'PUT');
  });
});

Deno.test('redirects', async (test) => {
  await test.step('trailing slash 308', async () => {
    const response = await fetch(new URL('/trailing-slash', origin), {
      headers,
      redirect: 'manual'
    });
    await response.body?.cancel();
    assertEquals(response.status, 308);
  });
  await test.step('trailing slash redirect', async () => {
    const response = await fetch(new URL('/trailing-slash', origin), {
      headers
    });
    await response.body?.cancel();
    assertEquals(response.status, 200);
    assert(response.redirected);
  });
  await test.step('no trailing slash 308', async () => {
    const response = await fetch(new URL('/no-trailing-slash/', origin), {
      headers,
      redirect: 'manual'
    });
    await response.body?.cancel();
    assertEquals(response.status, 308);
  });
  await test.step('no trailing slash redirect', async () => {
    const response = await fetch(new URL('/no-trailing-slash/', origin), {
      headers
    });
    await response.body?.cancel();
    assertEquals(response.status, 200);
    assert(response.redirected);
  });
});

Deno.test('static asset', async () => {
  const response = await fetch(new URL('/robots.txt', origin), {headers});
  const text = (await response.text()).trim();
  assertEquals(text, 'User-agent: * Allow: /');
  assert(response.headers.get('content-type')?.startsWith('text/plain'));
});

Deno.test('URL pattern', async () => {
  const response = await fetch(new URL('/2024/03/02/slug/', origin), {headers});
  const html = await response.text();
  const root = parseHTML(html);
  const node1 = root.find((n) => n.tag === 'h1');
  const node2 = root.find((n) => n.tag === 'time');
  assertEquals(response.status, 200);
  assertEquals(node1?.children[0]?.toString(), 'slug');
  assertEquals(node2?.children[0]?.toString(), '2024-03-02');
});

if (Deno.env.has('ORIGIN')) {
  Deno.test('origin', async () => {
    const originURL = new URL('/origin', origin);
    const response = await fetch(originURL, {headers});
    const data = await response.json();
    assertEquals(new URL(data.url).href, originURL.href);
    assertEquals(data['x-forwarded-host'], 'localhost');
    assertEquals(data['x-forwarded-proto'], 'https');
  });
}

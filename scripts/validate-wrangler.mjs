import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const wranglerSource = await readFile(
  path.join(repositoryRoot, 'wrangler.jsonc'),
  'utf8'
);
const wrangler = JSON.parse(wranglerSource.replace(/,\s*([}\]])/g, '$1'));
const expectedDomains = ['cresten.pizza', 'www.cresten.pizza'];
const configuredDomains = (wrangler.routes ?? [])
  .filter((route) => route.custom_domain === true)
  .map((route) => route.pattern)
  .sort();

if (wrangler.workers_dev !== true || wrangler.preview_urls !== true) {
  throw new Error('workers.dev and version preview URLs must remain enabled');
}
if (JSON.stringify(configuredDomains) !== JSON.stringify(expectedDomains)) {
  throw new Error(
    `Expected custom domains ${expectedDomains.join(', ')}, received ${configuredDomains.join(', ') || 'none'}`
  );
}

async function availablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port =
        typeof address === 'object' && address ? address.port : undefined;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

const port = await availablePort();
const executable = path.join(repositoryRoot, 'node_modules/.bin/wrangler');
const child = spawn(
  executable,
  [
    'dev',
    '--local',
    '--ip',
    '127.0.0.1',
    '--port',
    String(port),
    '--log-level',
    'warn',
    '--show-interactive-dev-session=false',
  ],
  {
    cwd: repositoryRoot,
    env: { ...process.env, NO_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);

let logs = '';
child.stdout.on('data', (chunk) => (logs += chunk));
child.stderr.on('data', (chunk) => (logs += chunk));

const baseUrl = `http://127.0.0.1:${port}`;

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null)
      throw new Error(`Wrangler exited before startup:\n${logs}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The local socket is not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Wrangler:\n${logs}`);
}

async function expectResponse(pathname, expectedStatus) {
  const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual' });
  if (response.status !== expectedStatus) {
    throw new Error(
      `${pathname} returned ${response.status}, expected ${expectedStatus}`
    );
  }
  return response;
}

try {
  await waitUntilReady();

  const root = await expectResponse('/', 200);
  if (!root.headers.get('content-security-policy')) {
    throw new Error('Root response is missing Content-Security-Policy');
  }
  if (!root.headers.get('cache-control')?.includes('must-revalidate')) {
    throw new Error('Root response is missing the HTML revalidation policy');
  }

  const slashless = await fetch(`${baseUrl}/about`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(slashless.status)) {
    throw new Error(
      `/about returned ${slashless.status}, expected a trailing-slash redirect`
    );
  }
  if (
    new URL(slashless.headers.get('location'), baseUrl).pathname !== '/about/'
  ) {
    throw new Error('/about redirect did not canonicalize to /about/');
  }
  await expectResponse('/about/', 200);

  const missing = await expectResponse('/definitely-not-a-real-page', 404);
  if (!(await missing.text()).includes('This slice is missing.')) {
    throw new Error('404 response did not use the custom page');
  }

  const homeHtml = await readFile(
    path.join(repositoryRoot, 'dist/index.html'),
    'utf8'
  );
  const assetPath = homeHtml.match(/href="(\/_astro\/[^"?]+\.css)"/)?.[1];
  if (!assetPath)
    throw new Error('Could not find the fingerprinted stylesheet');
  const asset = await expectResponse(assetPath, 200);
  if (!asset.headers.get('cache-control')?.includes('immutable')) {
    throw new Error('Fingerprint asset is missing immutable caching');
  }

  console.log(
    'Validated Wrangler domains/previews, static routing, security/cache headers, trailing slashes, and custom 404 behavior.'
  );
} finally {
  child.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

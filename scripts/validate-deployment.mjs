import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = path.join(repositoryRoot, 'dist');
const manifest = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'migration/legacy-site.json'),
    'utf8'
  )
);
const input = process.argv[2];

if (!input) {
  console.error(
    'Usage: npm run validate:deployment -- https://preview.example'
  );
  process.exit(1);
}

const deployment = new URL(input);
if (deployment.protocol !== 'https:') {
  throw new Error('Deployment validation requires an HTTPS origin');
}

deployment.pathname = '/';
deployment.search = '';
deployment.hash = '';

const issues = [];
const request = (pathname) =>
  fetch(new URL(pathname, deployment), {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  });

function routeFile(route) {
  if (route === '/') return path.join(outputDirectory, 'index.html');
  if (route.endsWith('/')) {
    return path.join(outputDirectory, route.replace(/^\//, ''), 'index.html');
  }
  return path.join(outputDirectory, route.replace(/^\//, ''));
}

async function compareRoute(route, expectedStatus = 200) {
  const [local, response] = await Promise.all([
    readFile(routeFile(route)),
    request(route),
  ]);
  const remote = Buffer.from(await response.arrayBuffer());

  if (response.status !== expectedStatus) {
    issues.push(
      `${route}: returned ${response.status}, expected ${expectedStatus}`
    );
  }
  if (!remote.equals(local)) {
    issues.push(
      `${route}: response body differs from the verified local build`
    );
  }

  return response;
}

const contentRoutes = [
  ...manifest.pages.map((page) => page.route),
  '/tags/',
  ...manifest.tagRoutes,
  '/rss.xml',
  '/sitemap-index.xml',
  '/sitemap-0.xml',
  '/robots.txt',
  '/keybase.txt',
];

for (const route of contentRoutes) await compareRoute(route);

const directoryRoutes = contentRoutes.filter(
  (route) => route !== '/' && route.endsWith('/')
);
for (const route of directoryRoutes) {
  const slashless = route.slice(0, -1);
  const response = await request(slashless);
  const location = response.headers.get('location');

  if (![301, 302, 307, 308].includes(response.status)) {
    issues.push(`${slashless}: did not redirect to its trailing-slash route`);
  } else if (!location || new URL(location, deployment).pathname !== route) {
    issues.push(
      `${slashless}: redirected to ${location ?? 'nowhere'}, expected ${route}`
    );
  }
}

const root = await request('/');
const requiredRootHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'referrer-policy',
];
for (const header of requiredRootHeaders) {
  if (!root.headers.get(header)) issues.push(`/: missing ${header} header`);
}
if (!root.headers.get('cache-control')?.includes('must-revalidate')) {
  issues.push('/: missing the HTML revalidation cache policy');
}
if (!root.headers.get('cf-cache-status')) {
  issues.push('/: missing Cloudflare cache status');
}
if (root.headers.get('server')?.toLowerCase() !== 'cloudflare') {
  issues.push('/: response is not served by Cloudflare');
}
if (root.headers.has('x-nf-request-id')) {
  issues.push('/: response still contains a Netlify request header');
}

const home = await readFile(routeFile('/'), 'utf8');
const assetRoute = home.match(/href="(\/_astro\/[^"?]+\.css)"/)?.[1];
if (!assetRoute) {
  issues.push('Could not identify the fingerprinted stylesheet');
} else {
  const asset = await compareRoute(assetRoute);
  if (!asset.headers.get('cache-control')?.includes('immutable')) {
    issues.push(`${assetRoute}: missing immutable cache policy`);
  }
}

const missingRoute = '/definitely-not-a-real-page';
const missingResponse = await request(missingRoute);
const [expected404, actual404] = await Promise.all([
  readFile(path.join(outputDirectory, '404.html')),
  missingResponse.arrayBuffer().then(Buffer.from),
]);
if (missingResponse.status !== 404) {
  issues.push(
    `${missingRoute}: returned ${missingResponse.status}, expected 404`
  );
}
if (!actual404.equals(expected404)) {
  issues.push(`${missingRoute}: did not return the verified custom 404 page`);
}

if (issues.length > 0) {
  console.error(`Deployment validation failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${contentRoutes.length} routes, ${directoryRoutes.length} trailing-slash redirects, TLS, exact response bodies, Cloudflare/security/cache headers, one fingerprinted asset, and a real custom 404 at ${deployment.origin}.`
  );
}

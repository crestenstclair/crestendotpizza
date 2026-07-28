import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'cheerio';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = path.join(repositoryRoot, 'dist');
const manifest = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'migration/legacy-site.json'),
    'utf8'
  )
);
const issues = [];

function routeFile(route) {
  if (route === '/') return path.join(outputDirectory, 'index.html');
  return path.join(outputDirectory, route.replace(/^\//, ''), 'index.html');
}

async function mustRead(file, label) {
  try {
    return await readFile(file, 'utf8');
  } catch {
    issues.push(`Missing ${label}: ${path.relative(repositoryRoot, file)}`);
    return '';
  }
}

for (const page of manifest.pages) {
  const html = await mustRead(routeFile(page.route), page.route);
  if (!html) continue;

  const $ = load(html);
  const canonical = $('link[rel="canonical"]').attr('href');
  const expectedCanonical = new URL(page.route, manifest.productionOrigin).href;

  if (!$('title').text().trim())
    issues.push(`${page.route}: missing document title`);
  if (!$('meta[name="description"]').attr('content')?.trim()) {
    issues.push(`${page.route}: missing meta description`);
  }
  if (canonical !== expectedCanonical) {
    issues.push(
      `${page.route}: canonical is ${canonical ?? 'missing'}, expected ${expectedCanonical}`
    );
  }
  if (!$('meta[property="og:title"]').attr('content'))
    issues.push(`${page.route}: missing og:title`);
  if (!$('meta[property="og:description"]').attr('content')) {
    issues.push(`${page.route}: missing og:description`);
  }
  if (
    $('h1').first().text().trim() !==
    (page.type === 'home' ? 'Latest stories' : page.title)
  ) {
    issues.push(
      `${page.route}: primary heading does not match the expected page title`
    );
  }
  if (
    html.includes('UA-133859287-1') ||
    html.includes('google-analytics.com')
  ) {
    issues.push(`${page.route}: legacy Google Analytics code is present`);
  }
}

for (const route of manifest.tagRoutes) {
  const html = await mustRead(routeFile(route), route);
  const $ = load(html);
  const expectedCanonical = new URL(route, manifest.productionOrigin).href;
  if ($('link[rel="canonical"]').attr('href') !== expectedCanonical) {
    issues.push(`${route}: missing expected canonical URL`);
  }
}

const tagIndex = await mustRead(routeFile('/tags/'), '/tags/');
if (
  tagIndex &&
  load(tagIndex)('h1').first().text().trim() !== 'Browse all tags'
) {
  issues.push('/tags/: missing tag directory heading');
}

const homeHtml = await mustRead(routeFile('/'), '/');
const expectedPosts = manifest.pages
  .filter((page) => page.type === 'post')
  .sort(
    (left, right) =>
      right.pubDate.localeCompare(left.pubDate) ||
      left.title.localeCompare(right.title)
  );
let priorPostPosition = -1;

for (const post of expectedPosts) {
  const position = homeHtml.indexOf(`href="${post.route}"`);
  if (position < 0) issues.push(`Home page does not link to ${post.route}`);
  if (position >= 0 && position < priorPostPosition)
    issues.push('Home page posts are not newest-first');
  priorPostPosition = Math.max(priorPostPosition, position);
}

const rss = await mustRead(path.join(outputDirectory, 'rss.xml'), 'RSS feed');
let priorRssPosition = -1;
for (const post of expectedPosts) {
  const link = new URL(post.route, manifest.productionOrigin).href;
  const position = rss.indexOf(link);
  if (position < 0) issues.push(`RSS feed does not include ${link}`);
  if (position >= 0 && position < priorRssPosition)
    issues.push('RSS entries are not newest-first');
  priorRssPosition = Math.max(priorRssPosition, position);
}

const sitemapFiles = (await readdir(outputDirectory)).filter((file) =>
  /^sitemap.*\.xml$/.test(file)
);
const sitemap = (
  await Promise.all(
    sitemapFiles.map((file) =>
      readFile(path.join(outputDirectory, file), 'utf8')
    )
  )
).join('\n');
const sitemapRoutes = [
  '/',
  '/about/',
  '/tags/',
  ...expectedPosts.map((post) => post.route),
  ...manifest.tagRoutes,
];

for (const route of sitemapRoutes) {
  const url = new URL(route, manifest.productionOrigin).href;
  if (!sitemap.includes(url)) issues.push(`Sitemap does not include ${url}`);
}

await mustRead(path.join(outputDirectory, '404.html'), 'custom 404 page');
await mustRead(path.join(outputDirectory, 'robots.txt'), 'robots.txt');
await mustRead(
  path.join(outputDirectory, '_headers'),
  'Cloudflare headers file'
);
await mustRead(
  path.join(outputDirectory, 'keybase.txt'),
  'keybase verification file'
);

const outputFiles = await readdir(outputDirectory, { recursive: true });
for (const file of outputFiles) {
  if (!/\.(?:html|xml)$/.test(file)) continue;
  const source = await readFile(path.join(outputDirectory, file), 'utf8');
  if (
    source.includes('Local draft preview') ||
    source.includes('draft-label')
  ) {
    issues.push(`${file}: production output contains draft-only UI`);
  }
}

if (issues.length > 0) {
  console.error(`Output validation failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${manifest.pages.length + manifest.tagRoutes.length + 1} HTML routes, RSS, sitemap, metadata, static policy files, and draft exclusion.`
  );
}

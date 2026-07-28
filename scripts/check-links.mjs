import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { load } from 'cheerio';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const outputDirectory = path.join(repositoryRoot, 'dist');
const siteOrigin = 'https://cresten.pizza';
const issues = [];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function pageRoute(file) {
  const relative = path
    .relative(outputDirectory, file)
    .split(path.sep)
    .join('/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html'))
    return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
}

async function targetExists(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded.replace(/^\//, '');
  const candidates = decoded.endsWith('/')
    ? [path.join(outputDirectory, relative, 'index.html')]
    : [
        path.join(outputDirectory, relative),
        path.join(outputDirectory, `${relative}.html`),
        path.join(outputDirectory, relative, 'index.html'),
      ];

  return (await Promise.all(candidates.map(exists))).some(Boolean);
}

const allFiles = await readdir(outputDirectory, { recursive: true });
const htmlFiles = allFiles
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(outputDirectory, file));

for (const file of htmlFiles) {
  const route = pageRoute(file);
  const $ = load(await readFile(file, 'utf8'));

  for (const element of $('a[href]').toArray()) {
    const href = $(element).attr('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      continue;
    }

    const url = new URL(href, new URL(route, siteOrigin));
    if (url.origin !== siteOrigin) continue;
    if (!(await targetExists(url.pathname)))
      issues.push(`${route}: broken internal link ${href}`);
  }
}

if (issues.length > 0) {
  console.error(`Internal link validation failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated internal links across ${htmlFiles.length} generated HTML files.`
  );
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

import {
  bodySha256,
  loadMarkdownRecords,
  validateAgainstManifest,
  validatePostMetadata,
} from './content-validation.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'migration/legacy-site.json'),
    'utf8'
  )
);
const posts = await loadMarkdownRecords(
  path.join(repositoryRoot, 'src/content/blog')
);
const issues = [
  ...validatePostMetadata(posts),
  ...validateAgainstManifest(posts, manifest),
];
const aboutSource = await readFile(
  path.join(repositoryRoot, 'src/content/pages/about.md'),
  'utf8'
);
const about = matter(aboutSource);
const expectedAbout = manifest.pages.find((page) => page.type === 'about');

if (!expectedAbout) issues.push('Migration manifest is missing the About page');
if (about.data.title !== expectedAbout?.title)
  issues.push('About title differs from migration manifest');
if (bodySha256(about.content) !== expectedAbout?.bodySha256) {
  issues.push('About body checksum differs from migration manifest');
}

if (issues.length > 0) {
  console.error(`Content validation failed:\n- ${issues.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${posts.length} legacy posts, the About page, and ${manifest.tagRoutes.length} tag routes.`
  );
}

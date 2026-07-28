import { constants } from 'node:fs';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import { isStrictCalendarDate, slugify } from '../src/lib/content-utils.ts';

export async function createPost({
  title,
  date = new Date().toISOString().slice(0, 10),
  contentDirectory,
  templatePath,
}) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) throw new Error('Post title cannot be empty');
  if (!isStrictCalendarDate(date))
    throw new Error(`Invalid post date: ${date}`);

  const slug = slugify(normalizedTitle);
  if (!slug)
    throw new Error('Post title must contain at least one letter or number');

  const routeSlug = `${date}-${slug}`;
  const filename = `${routeSlug}.md`;
  const destination = path.join(contentDirectory, filename);

  await mkdir(contentDirectory, { recursive: true });

  try {
    await access(destination, constants.F_OK);
    throw new Error(`Refusing to overwrite existing post: ${destination}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Refusing to overwrite')
    )
      throw error;
  }

  const entries = await readdir(contentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const existing = matter(
      await readFile(path.join(contentDirectory, entry.name), 'utf8')
    );

    if (existing.data.slug === routeSlug) {
      throw new Error(
        `Refusing duplicate post slug "${routeSlug}" in ${entry.name}`
      );
    }
  }

  const template = await readFile(templatePath, 'utf8');
  const source = template
    .replace('{{TITLE}}', JSON.stringify(normalizedTitle))
    .replace('{{DATE}}', date)
    .replace('{{SLUG}}', routeSlug);

  await writeFile(destination, source, { encoding: 'utf8', flag: 'wx' });

  return { destination, filename, routeSlug };
}

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import matter from 'gray-matter';
import { afterEach, describe, expect, it } from 'vitest';

// @ts-ignore The post scaffolder is also the production CLI module.
import { createPost } from '../scripts/post-scaffold.mjs';

const temporaryDirectories: string[] = [];
const templatePath = path.resolve('templates/post.md');

async function temporaryContentDirectory() {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'crestendotpizza-posts-')
  );
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true }))
  );
});

describe('new post scaffolding', () => {
  it('creates a deterministic dated draft with valid frontmatter', async () => {
    const contentDirectory = await temporaryContentDirectory();
    const result = await createPost({
      title: 'A Small Thought',
      date: '2026-07-27',
      contentDirectory,
      templatePath,
    });
    const parsed = matter(await readFile(result.destination, 'utf8'));

    expect(result.filename).toBe('2026-07-27-a-small-thought.md');
    expect(parsed.data).toMatchObject({
      title: 'A Small Thought',
      pubDate: '2026-07-27',
      slug: '2026-07-27-a-small-thought',
      tags: [],
      draft: true,
    });
  });

  it('rejects empty titles and invalid dates', async () => {
    const contentDirectory = await temporaryContentDirectory();

    await expect(
      createPost({
        title: ' ',
        date: '2026-07-27',
        contentDirectory,
        templatePath,
      })
    ).rejects.toThrow('title cannot be empty');
    await expect(
      createPost({
        title: 'Thought',
        date: '2026-02-30',
        contentDirectory,
        templatePath,
      })
    ).rejects.toThrow('Invalid post date');
  });

  it('refuses filename and slug collisions without overwriting', async () => {
    const contentDirectory = await temporaryContentDirectory();
    const first = await createPost({
      title: 'Same Thought',
      date: '2026-07-27',
      contentDirectory,
      templatePath,
    });
    const original = await readFile(first.destination, 'utf8');

    await expect(
      createPost({
        title: 'Same Thought',
        date: '2026-07-27',
        contentDirectory,
        templatePath,
      })
    ).rejects.toThrow('Refusing to overwrite');
    expect(await readFile(first.destination, 'utf8')).toBe(original);

    await writeFile(
      path.join(contentDirectory, 'different-name.md'),
      '---\ntitle: Different\ndescription: Description\npubDate: 2026-07-27\nslug: 2026-07-28-duplicate\ntags: []\ndraft: true\n---\n',
      'utf8'
    );
    await expect(
      createPost({
        title: 'Duplicate',
        date: '2026-07-28',
        contentDirectory,
        templatePath,
      })
    ).rejects.toThrow('Refusing duplicate post slug');
  });
});

import { describe, expect, it } from 'vitest';

import {
  assertUniquePostSlugs,
  buildTagIndex,
  filterVisiblePosts,
  isStrictCalendarDate,
  slugify,
} from '../src/lib/content-utils';

function post(
  title: string,
  slug: string,
  pubDate: string,
  tags: string[] = [],
  draft = false
) {
  return { data: { title, slug, pubDate, tags, draft } };
}

describe('strict calendar dates', () => {
  it('accepts real ISO dates and rejects rollover dates', () => {
    expect(isStrictCalendarDate('2024-02-29')).toBe(true);
    expect(isStrictCalendarDate('2021-01-35')).toBe(false);
    expect(isStrictCalendarDate('2023-02-29')).toBe(false);
    expect(isStrictCalendarDate('01/03/2021')).toBe(false);
  });
});

describe('post visibility and ordering', () => {
  const posts = [
    post('Older', 'older', '2023-01-01'),
    post('Draft', 'draft', '2025-01-01', [], true),
    post('Newer', 'newer', '2024-01-01'),
  ];

  it('excludes drafts from production and sorts newest first', () => {
    expect(
      filterVisiblePosts(posts, false).map((entry) => entry.data.title)
    ).toEqual(['Newer', 'Older']);
  });

  it('includes drafts when explicitly previewing', () => {
    expect(
      filterVisiblePosts(posts, true).map((entry) => entry.data.title)
    ).toEqual(['Draft', 'Newer', 'Older']);
  });
});

describe('slugs and tags', () => {
  it('creates deterministic URL-safe slugs', () => {
    expect(slugify('A Small Thought: Pizza & APIs')).toBe(
      'a-small-thought-pizza-apis'
    );
  });

  it('rejects duplicate post slugs', () => {
    expect(() =>
      assertUniquePostSlugs([
        post('One', 'same', '2024-01-01'),
        post('Two', 'same', '2024-01-02'),
      ])
    ).toThrow('Duplicate post slug');
  });

  it('deduplicates capitalization variants into one tag route', () => {
    const groups = buildTagIndex([
      post('One', 'one', '2024-01-01', ['VideoGames']),
      post('Two', 'two', '2024-01-02', ['video games']),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.slug).toBe('video-games');
    expect(groups[0]?.posts).toHaveLength(2);
  });
});

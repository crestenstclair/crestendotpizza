import { describe, expect, it } from 'vitest';

// @ts-ignore The production validator is intentionally executable JavaScript.
import { validatePostMetadata } from '../scripts/content-validation.mjs';

function record(filename: string, overrides: Record<string, unknown> = {}) {
  return {
    filename,
    data: {
      title: 'Title',
      description: 'Description',
      pubDate: '2024-01-01',
      slug: filename.replace('.md', ''),
      tags: [],
      draft: false,
      ...overrides,
    },
    content: 'Body\n',
  };
}

describe('production content validation', () => {
  it('reports invalid dates and missing fields', () => {
    const issues = validatePostMetadata([
      record('bad.md', { title: '', pubDate: '2021-01-35' }),
    ]);

    expect(issues).toContain('bad.md: title must be a non-empty string');
    expect(issues).toContain(
      'bad.md: pubDate must be a real YYYY-MM-DD calendar date'
    );
  });

  it('reports duplicate slugs', () => {
    const issues = validatePostMetadata([
      record('one.md', { slug: 'same' }),
      record('two.md', { slug: 'same' }),
    ]);

    expect(
      issues.some((issue: string) => issue.includes('duplicate slug "same"'))
    ).toBe(true);
  });
});

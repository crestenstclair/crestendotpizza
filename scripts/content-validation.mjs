import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import { isStrictCalendarDate, tagSlug } from '../src/lib/content-utils.ts';

export function normalizeBody(content) {
  return `${content.replace(/\r\n/g, '\n').trimEnd()}\n`;
}

export function bodySha256(content) {
  return createHash('sha256').update(normalizeBody(content)).digest('hex');
}

export async function loadMarkdownRecords(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const records = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name)) continue;
    const file = path.join(directory, entry.name);
    const source = await readFile(file, 'utf8');
    const parsed = matter(source);
    records.push({
      file,
      filename: entry.name,
      data: parsed.data,
      content: parsed.content,
    });
  }

  return records;
}

function checkNonEmptyString(issues, record, field) {
  if (typeof record.data[field] !== 'string' || !record.data[field].trim()) {
    issues.push(`${record.filename}: ${field} must be a non-empty string`);
  }
}

export function validatePostMetadata(records) {
  const issues = [];
  const slugs = new Map();

  for (const record of records) {
    checkNonEmptyString(issues, record, 'title');
    checkNonEmptyString(issues, record, 'description');
    checkNonEmptyString(issues, record, 'slug');

    if (!isStrictCalendarDate(record.data.pubDate)) {
      issues.push(
        `${record.filename}: pubDate must be a real YYYY-MM-DD calendar date`
      );
    }

    if (
      record.data.updatedDate !== undefined &&
      !isStrictCalendarDate(record.data.updatedDate)
    ) {
      issues.push(
        `${record.filename}: updatedDate must be a real YYYY-MM-DD calendar date`
      );
    }

    if (
      !Array.isArray(record.data.tags) ||
      record.data.tags.some((tag) => !tag?.trim?.())
    ) {
      issues.push(
        `${record.filename}: tags must be a list of non-empty strings`
      );
    }

    if (typeof record.data.draft !== 'boolean') {
      issues.push(`${record.filename}: draft must be true or false`);
    }

    if (typeof record.data.slug === 'string') {
      const prior = slugs.get(record.data.slug);
      if (prior)
        issues.push(
          `${record.filename}: duplicate slug "${record.data.slug}" also used by ${prior}`
        );
      slugs.set(record.data.slug, record.filename);
    }
  }

  return issues;
}

export function validateAgainstManifest(records, manifest) {
  const issues = [];
  const expectedPosts = manifest.pages.filter((page) => page.type === 'post');
  const recordsBySlug = new Map(
    records.map((record) => [record.data.slug, record])
  );

  if (records.length !== expectedPosts.length) {
    issues.push(
      `Expected ${expectedPosts.length} posts, found ${records.length}`
    );
  }

  for (const expected of expectedPosts) {
    const record = recordsBySlug.get(expected.slug);
    if (!record) {
      issues.push(`Missing legacy post: ${expected.slug}`);
      continue;
    }

    for (const field of ['title', 'pubDate', 'slug']) {
      if (record.data[field] !== expected[field]) {
        issues.push(
          `${record.filename}: ${field} changed from manifest value ${JSON.stringify(expected[field])}`
        );
      }
    }

    if (record.data.draft !== false) {
      issues.push(
        `${record.filename}: migrated legacy post must remain published`
      );
    }

    if (JSON.stringify(record.data.tags) !== JSON.stringify(expected.tags)) {
      issues.push(`${record.filename}: tags differ from migration manifest`);
    }

    const expectedHash = expected.migratedBodySha256 ?? expected.bodySha256;
    const actualHash = bodySha256(record.content);
    if (actualHash !== expectedHash) {
      issues.push(`${record.filename}: body checksum mismatch (${actualHash})`);
    }

    if (expected.route !== `/blog/${record.data.slug}/`) {
      issues.push(
        `${record.filename}: route no longer matches the legacy manifest`
      );
    }
  }

  const actualTagRoutes = [
    ...new Set(
      records
        .filter((record) => record.data.draft === false)
        .flatMap((record) =>
          record.data.tags.map((tag) => `/tags/${tagSlug(tag)}/`)
        )
    ),
  ].sort();

  if (
    JSON.stringify(actualTagRoutes) !==
    JSON.stringify([...manifest.tagRoutes].sort())
  ) {
    issues.push('Published tag routes differ from the migration manifest');
  }

  return issues;
}

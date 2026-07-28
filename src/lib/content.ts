import { getCollection, type CollectionEntry } from 'astro:content';

import {
  assertUniquePostSlugs,
  buildTagIndex,
  filterVisiblePosts,
  type TagGroup,
} from './content-utils';

export type BlogPost = CollectionEntry<'blog'>;

export async function getBlogPosts(
  options: { includeDrafts?: boolean } = {}
): Promise<BlogPost[]> {
  const posts = await getCollection('blog');
  assertUniquePostSlugs(posts);
  return filterVisiblePosts(posts, options.includeDrafts ?? false);
}

export async function getTagGroups(
  options: { includeDrafts?: boolean } = {}
): Promise<TagGroup<BlogPost>[]> {
  return buildTagIndex(await getBlogPosts(options));
}

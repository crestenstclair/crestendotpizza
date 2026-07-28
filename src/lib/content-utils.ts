export interface PostDataLike {
  title: string;
  pubDate: string;
  slug: string;
  tags: string[];
  draft: boolean;
}

export interface PostLike<TData extends PostDataLike = PostDataLike> {
  data: TData;
}

export function isStrictCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function tagSlug(tag: string): string {
  return slugify(tag);
}

export function postPath(post: PostLike): string {
  return `/blog/${post.data.slug}/`;
}

export function comparePostsNewestFirst<T extends PostLike>(
  left: T,
  right: T
): number {
  return (
    right.data.pubDate.localeCompare(left.data.pubDate) ||
    left.data.title.localeCompare(right.data.title)
  );
}

export function filterVisiblePosts<T extends PostLike>(
  posts: T[],
  includeDrafts: boolean
): T[] {
  return posts
    .filter((post) => includeDrafts || !post.data.draft)
    .sort(comparePostsNewestFirst);
}

export function assertUniquePostSlugs<T extends PostLike>(posts: T[]): void {
  const seen = new Map<string, string>();

  for (const post of posts) {
    const priorTitle = seen.get(post.data.slug);

    if (priorTitle) {
      throw new Error(
        `Duplicate post slug "${post.data.slug}" used by "${priorTitle}" and "${post.data.title}"`
      );
    }

    seen.set(post.data.slug, post.data.title);
  }
}

export interface TagGroup<T extends PostLike = PostLike> {
  label: string;
  slug: string;
  posts: T[];
}

export function buildTagIndex<T extends PostLike>(posts: T[]): TagGroup<T>[] {
  const groups = new Map<string, TagGroup<T>>();

  for (const post of posts) {
    const postTags = new Set<string>();

    for (const label of post.data.tags) {
      const slug = tagSlug(label);

      if (!slug || postTags.has(slug)) continue;
      postTags.add(slug);

      const group = groups.get(slug) ?? { label, slug, posts: [] };
      group.posts.push(post);
      groups.set(slug, group);
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      posts: group.posts.sort(comparePostsNewestFirst),
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`));
}

import rss from '@astrojs/rss';

import { getBlogPosts } from '../lib/content';
import { postPath } from '../lib/content-utils';
import { SITE } from '../lib/site';

export async function GET(context: { site: URL | undefined }) {
  const posts = await getBlogPosts();

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.origin,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(`${post.data.pubDate}T00:00:00Z`),
      link: postPath(post),
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}

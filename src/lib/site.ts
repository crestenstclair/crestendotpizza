export const SITE = {
  name: "Cresten's Pizza Blog",
  owner: 'Cresten St. Clair',
  description:
    'Thoughts on programming, books, games, music, and whatever comes next.',
  origin: 'https://cresten.pizza',
  feedPath: '/rss.xml',
  githubUrl: 'https://github.com/crestenstclair',
} as const;

export const NAVIGATION = [
  { href: '/', label: 'Writing' },
  { href: '/tags/', label: 'Tags' },
  { href: '/about/', label: 'About' },
] as const;

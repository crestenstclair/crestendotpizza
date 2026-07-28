import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { isStrictCalendarDate } from './lib/content-utils';

const strictDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an ISO date in YYYY-MM-DD format')
  .refine(isStrictCalendarDate, 'Use a real calendar date');

const routeSlug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase kebab-case slug');

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    pubDate: strictDate,
    updatedDate: strictDate.optional(),
    slug: routeSlug,
    tags: z.array(z.string().trim().min(1)).default([]),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    slug: routeSlug,
  }),
});

export const collections = { blog, pages };

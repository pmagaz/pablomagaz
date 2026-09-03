import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Blog posts are markdown files in src/content/blog.
 * Everything is read at build time — no CMS, no runtime fetching.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    /** Shown on the archive rows and the featured lead post. */
    excerpt: z.string(),
    /** Meta description; falls back to the excerpt. */
    description: z.string().optional(),
    /** Topic slug — must exist in src/data/topics.ts. */
    topic: z.string(),
    /** Eyebrow above the post title, e.g. "Engineering leadership". */
    category: z.string().optional(),
    publishedAt: z.coerce.date(),
    /** Overrides the computed reading time when set. */
    readingTime: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

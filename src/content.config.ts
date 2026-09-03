import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categorySlugs } from '~/data/categories';

/**
 * Blog posts are markdown files in src/content/blog, read at build time.
 * Every post gets a static detail page — no CMS, no runtime fetching.
 *
 * Frontmatter follows the house format:
 *   title, date, slug, author, excerpt, category, keywords
 */
const blog = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/blog',
    // The URL comes from the frontmatter slug, falling back to the filename.
    generateId: ({ entry, data }) =>
      typeof data.slug === 'string' && data.slug.length > 0
        ? data.slug
        : entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** Canonical URL segment for the post. */
    slug: z.string(),
    author: z.string().default('Pablo Magaz'),
    /** Shown on the archive rows, the featured post and as the meta description. */
    excerpt: z.string(),
    category: z.enum(categorySlugs as [string, ...string[]]),
    keywords: z.array(z.string()).default([]),
    featuredImage: z.string().optional(),
    /** Overrides the computed reading time when set. */
    readingTime: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

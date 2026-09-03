import { site } from '~/data/site';

export interface SeoInput {
  title?: string;
  description?: string;
  /** Absolute or root-relative image URL for social cards. */
  image?: string;
  /** `article` for blog posts, `website` elsewhere. */
  type?: 'website' | 'article';
  publishedAt?: Date;
  /** From a post's frontmatter. */
  keywords?: string[];
  noindex?: boolean;
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: 'website' | 'article';
  publishedAt?: string;
  keywords?: string;
  noindex: boolean;
}

/** Builds the final head values for a page. `url` is `Astro.url`. */
export function resolveSeo(input: SeoInput, url: URL, siteUrl: URL | undefined): ResolvedSeo {
  const base = siteUrl ?? url;
  const canonicalPath = url.pathname.replace(/\/+$/, '') || '/';

  return {
    title: input.title ? `${input.title} — ${site.name}` : site.title,
    description: input.description ?? site.description,
    canonical: new URL(canonicalPath, base).href,
    image: new URL(input.image ?? '/og-default.png', base).href,
    type: input.type ?? 'website',
    publishedAt: input.publishedAt?.toISOString(),
    keywords: input.keywords?.length ? input.keywords.join(', ') : undefined,
    noindex: input.noindex ?? false,
  };
}

/**
 * JSON-LD for the site owner. Emitted on every page so search engines can
 * tie the site to a single Person entity.
 */
export function personSchema(siteUrl: URL | undefined): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: site.role,
    description: site.description,
    // No email until a real address is confirmed — structured data is public.
    url: siteUrl?.href,
    sameAs: site.social.map((link) => link.href),
  });
}

/** JSON-LD for a single blog post. */
export function articleSchema(
  post: {
    title: string;
    description: string;
    publishedAt: Date;
    url: string;
    author?: string;
    keywords?: string[];
  },
  siteUrl: URL | undefined,
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt.toISOString(),
    url: post.url,
    keywords: post.keywords?.length ? post.keywords.join(', ') : undefined,
    author: {
      '@type': 'Person',
      name: post.author ?? site.name,
      url: siteUrl?.href,
    },
  });
}

import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '~/data/site';
import { getSortedPosts, postHref } from '~/lib/posts';

/** Static feed, generated at build time like every other route. */
export const GET: APIRoute = async (context) => {
  const posts = await getSortedPosts();

  return rss({
    title: `${site.name} — Blog`,
    description: site.description,
    site: context.site ?? context.url.origin,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? post.data.excerpt,
      pubDate: post.data.publishedAt,
      link: postHref(post.id),
      categories: [post.data.topic],
    })),
    customData: '<language>en</language>',
  });
};

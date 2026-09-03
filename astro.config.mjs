import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

/** Update once the production domain is attached in Netlify. */
export const SITE = 'https://www.pablomagaz.com';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'ignore',
  // React components are rendered to static HTML at build time. They only ship
  // JS where a `client:*` directive is used (mobile menu, contact form).
  integrations: [react(), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Outfit',
      cssVariable: '--font-outfit',
      // 400 = body, 600 = medium. Font files are downloaded and self-hosted
      // at build time, so no request ever leaves the visitor's browser.
      weights: [400, 600],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    },
  ],
});

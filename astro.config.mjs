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
      provider: fontProviders.local(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      // Space Grotesk only, per the design system. 400 = body, 600 = medium.
      fallbacks: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['./src/assets/fonts/SpaceGrotesk-Regular.woff2'],
          },
          {
            weight: 600,
            style: 'normal',
            src: ['./src/assets/fonts/SpaceGrotesk-Medium.woff2'],
          },
        ],
      },
    },
  ],
});

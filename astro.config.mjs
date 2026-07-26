import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mehrunnisaraja.com',
  integrations: [mdx(), sitemap()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  // No `layout`/`responsiveStyles`: Astro's injected styles force object-fit:cover,
  // which fights the object-contain framing. Sizing is handled in Tailwind instead;
  // widths/sizes props still produce the srcset.
});

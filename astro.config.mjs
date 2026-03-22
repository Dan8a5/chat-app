import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { plugins: [tailwindcss()] },
  // Railway's reverse proxy rewrites the internal host, causing Astro's
  // checkOrigin to compare mismatched origins and reject valid same-origin
  // fetch() calls with 403. CSRF is covered by sameSite:lax on the cookie —
  // cross-site requests won't carry the cookie, so auth checks return 401.
  security: { checkOrigin: false },
});

import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  vite: {
    resolve: {
      alias: {
        '@void-drift/engine': path.resolve('../../packages/engine/src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify('0.0.1')
    }
  }
});
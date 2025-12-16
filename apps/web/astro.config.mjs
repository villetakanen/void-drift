import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import path from 'path';
import { readFileSync } from 'fs';

const rootPackage = JSON.parse(readFileSync(path.resolve('../../package.json'), 'utf-8'));


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
      __APP_VERSION__: JSON.stringify(rootPackage.version)
    }

  }
});
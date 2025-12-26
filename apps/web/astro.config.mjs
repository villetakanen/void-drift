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
        '@void-drift/core/styles': path.resolve('../../packages/core/src/lib/styles'),
        '@void-drift/core': path.resolve('../../packages/core/src'),
        '@void-drift/mode-a': path.resolve('../../packages/mode-a/src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(rootPackage.version)
    }

  }
});
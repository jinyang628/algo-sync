import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    default_locale: 'en',
    description: 'Syncs Leetcode Submissions with Github',
    name: 'Leetcode Sync',
    version: '0.0.1',
    permissions: ['tabs', 'background', 'storage', 'identity', "windows"],
    background: {
      service_worker: 'background.js',
      persistent: true,
    },
    content_scripts: [
      {
        matches: ['*://leetcode.com/*'], // Matches Leetcode Urls
        js: ['/content-scripts/content.js'],
      },
    ],
    web_accessible_resources: [
      {
        resources: ['icon/*.png', 'images/*.svg', 'images/*.png'],
        matches: ['*://*/*'],
      },
    ],
  },
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  outDir: 'dist',
});

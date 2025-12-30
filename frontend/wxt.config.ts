import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    default_locale: 'en',
    description: 'Syncs Leetcode Submissions with Github',
    name: 'Leetcode Sync',
    version: '0.0.1',
    permissions: [
      'tabs',
      'background',
      'storage',
      'identity',
      'windows',
      'activeTab',
      'scripting',
      'tabCapture',
    ],
    host_permissions: [
      '*://leetcode.com/*',
      'https://algo-sync.onrender.com/*',
      'https://api.github.com/*',
    ],
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
        resources: ['icon/*.png', 'images/*.svg', 'images/*.png', 'injected.js'],
        matches: ['*://*/*'],
      },
      {
        resources: ['options.html'],
        matches: ['https://algo-sync.onrender.com/*'],
      },
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'self'; connect-src 'self' https://algo-sync.onrender.com https://api.github.com",
    },
  },
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  srcDir: 'src',
  outDir: 'dist',
});

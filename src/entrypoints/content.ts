import { EXTRACT_HTML_ACTION } from '@/constants/browser';

import '@/styles/globals.css';

export default defineContentScript({
  matches: ['*://mail.google.com/*'], // Matches Gmail URLs
  async main(ctx) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case EXTRACT_HTML_ACTION:
          const html = document.documentElement.outerHTML;
          sendResponse({ html });
          break;
        default:
          break;
      }
    });
  },
});

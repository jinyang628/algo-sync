import { EXCHANGE_TOKEN_ACTION } from '@/lib/constants';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case EXCHANGE_TOKEN_ACTION:
        return undefined;
      default:
        console.error('Action not recognised in background script');
        return undefined;
    }
  });
});

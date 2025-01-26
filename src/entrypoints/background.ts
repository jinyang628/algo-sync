import { exchangeTokenRequestSchema } from '@/types/auth';

import { EXCHANGE_TOKEN_ACTION } from '@/lib/constants';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender) => {
    switch (message.action) {
      case EXCHANGE_TOKEN_ACTION:
        return (async () => {
          try {
            const { code, clientId, clientSecret, redirectUri } = exchangeTokenRequestSchema.parse(
              message.input,
            );
            console.log(code, clientId, clientSecret, redirectUri);
          } catch (error: unknown) {
            console.error(error);
            return undefined;
          }
        })();

      default:
        console.error('Action not recognised in background script');
        return undefined;
    }
  });
});

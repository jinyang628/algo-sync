export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      default:
        console.error('Action not recognised in background script');
        return undefined;
    }
  });
});

import pushToGitHub from '@/lib/github';
import { extractCodeFromContainer, extractProblemNameFromUrl } from '@/lib/utils';

import '@/styles/globals.css';

function isSubmissionAccepted(): boolean {
  const resultElement = document.querySelector('[data-e2e-locator="submission-result"]');

  if (!resultElement) {
    console.error('Submission result element not found.');
    return false;
  }
  console.log('Submission result element found!');
  return true;
}

export default defineContentScript({
  matches: ['*://leetcode.com/*'],

  async main(ctx) {
    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(async (mutations) => {
      if (isSubmissionAccepted()) {
        observer.disconnect();
        const problemName: string = extractProblemNameFromUrl(window.location.href);
        const codeContainer = document.getElementsByClassName(
          'view-lines monaco-mouse-cursor-text',
        )[0];
        const code: string = extractCodeFromContainer(codeContainer);
        await pushToGitHub(problemName, code, 'Another day another leetcode submission');
      }
    });
    // Find and watch targetDiv after submit button is clicked
    const submitButton = document.querySelector('[data-e2e-locator="console-submit-button"]');
    if (!submitButton) {
      console.error('Submit button not found.');
      return;
    }
    submitButton.addEventListener('click', () => {
      console.log('Submit clicked, watching for DOM changes...');
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        default:
          break;
      }
    });
  },
});

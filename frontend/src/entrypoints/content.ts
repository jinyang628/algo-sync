import { Language as LanguageSuffix } from '@/types/languages';

import pushToGitHub from '@/lib/github';
import {
  extractCodeFromContainer,
  extractProblemNameFromUrl,
  identifyLanguage as identifyLanguageSuffix,
} from '@/lib/utils';

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

  async main() {
    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(async () => {
      if (isSubmissionAccepted()) {
        observer.disconnect();
        const problemName: string = extractProblemNameFromUrl(window.location.href);
        const codeContainer = document.querySelector('div[class="group relative"][translate="no"]');
        if (!codeContainer) {
          console.error('Code container not found');

          return;
        }
        const code: string = extractCodeFromContainer(codeContainer);
        const languageSuffix: LanguageSuffix = identifyLanguageSuffix(codeContainer);
        await pushToGitHub(
          `${problemName}.${languageSuffix}`,
          code,
          'Another day another leetcode submission',
        );
      }
    });
    // Find and watch targetDiv after submit button is clicked
    const submitButton = document.querySelector('[data-e2e-locator="console-submit-button"]');
    if (!submitButton) {
      console.error('Submit button not found.');

      return;
    }
    console.log('Listening for DOM changes...');
    submitButton.addEventListener('click', () => {
      console.log('Submit clicked, watching for DOM changes...');
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    chrome.runtime.onMessage.addListener((request) => {
      switch (request.action) {
        default:
          break;
      }
    });
  },
});

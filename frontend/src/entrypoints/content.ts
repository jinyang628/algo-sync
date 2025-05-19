import pushToGitHub from '@/lib/github';
import { injectCustomScript } from '@/lib/inject';
import { audioRequestActionSchema, audioRequestSchema } from '@/lib/types/audio';
import { Language as LanguageSuffix } from '@/lib/types/languages';
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
    await injectCustomScript('/injected.js', { keepInDom: true });

    window.addEventListener(
      'message',
      (event) => {
        if (event.source !== window) {
          return;
        }

        if (
          event.source !== window ||
          !event.data ||
          event.data.type !== 'ALGO_SYNC_AUDIO_DATA' ||
          event.data.source !== 'algo-sync-injected-script'
        ) {
          return;
        }
        const audioRequest = audioRequestSchema.parse(event.data.payload);
        const audioRequestAction = audioRequestActionSchema.parse({
          action: 'audio',
          audioDataUrl: audioRequest.audioDataUrl,
        });

        chrome.runtime.sendMessage(audioRequestAction);
      },
      false,
    );

    // Create mutation observer to watch for DOM changes
    const observer = new MutationObserver(async () => {
      if (isSubmissionAccepted()) {
        observer.disconnect();
        const problemName: string = extractProblemNameFromUrl(window.location.href);
        const code: string = extractCodeFromContainer();
        const languageSuffix: LanguageSuffix = identifyLanguageSuffix();
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

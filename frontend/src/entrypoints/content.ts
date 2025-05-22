import pushToGitHub from '@/lib/github';
import { injectCustomScript } from '@/lib/inject';
import { speakTextInPage } from '@/lib/speech';
import {
  apiKeyErrorSchema,
  audioRequestActionSchema,
  audioRequestSchema,
  textToSpeechRequestActionSchema,
} from '@/lib/types/audio';
import { Language as LanguageSuffix } from '@/lib/types/languages';
import {
  extractCodeFromAcceptedSubmissionContainer,
  extractProblemNameFromUrl,
  identifyLanguage as identifyLanguageSuffix,
  isSubmissionAccepted,
} from '@/lib/utils';

import '@/styles/globals.css';

export default defineContentScript({
  matches: ['*://leetcode.com/*'],

  async main() {
    await injectCustomScript('/injected.js', { keepInDom: true });

    window.addEventListener(
      'message',
      async (event) => {
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
        const prevProblemName: string = await browser.storage.local
          .get('prevProblemName')
          .then((result) => {
            return result.prevProblemName;
          });
        if (prevProblemName !== audioRequest.problemName) {
          await browser.storage.local.set({ prevProblemName: audioRequest.problemName });
          await browser.storage.local.set({ prevConversationParts: null });
        }
        const audioRequestAction = audioRequestActionSchema.parse({
          action: 'audio',
          audioDataUrl: audioRequest.audioDataUrl,
          code: audioRequest.code,
          problemName: audioRequest.problemName,
          problemDescription: audioRequest.problemDescription,
        });

        await chrome.runtime.sendMessage(audioRequestAction);
      },
      false,
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (apiKeyErrorSchema.safeParse(request).success) {
        window.postMessage({
          type: 'RECORD_BUTTON_STATUS_UPDATE',
          payload: request,
        });
      } else if (textToSpeechRequestActionSchema.safeParse(request).success) {
        speakTextInPage(request.text)
          .then(() => {
            sendResponse({ success: true, message: 'TTS initiated by content script.' });
            window.postMessage({
              type: 'RECORD_BUTTON_STATUS_UPDATE',
              payload: {
                type: 'sleeping',
              },
            });
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: `TTS failed in content script: ${error.message}`,
            });
            window.postMessage({
              type: 'RECORD_BUTTON_STATUS_UPDATE',
              payload: {
                type: 'error',
              },
            });
          });

        return true;
      } else {
        console.error('[AlgoSync ContentScript] Received unknown message:', request);

        return false;
      }
    });

    const observer = new MutationObserver(async () => {
      if (isSubmissionAccepted()) {
        observer.disconnect();
        const problemName: string = extractProblemNameFromUrl(window.location.href);
        const code: string = extractCodeFromAcceptedSubmissionContainer();
        const languageSuffix: LanguageSuffix = identifyLanguageSuffix();
        await pushToGitHub(
          `${problemName}.${languageSuffix}`,
          code,
          'Another day another leetcode submission',
        );
      }
    });
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
  },
});

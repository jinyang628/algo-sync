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

async function speakTextInPage(text: string): Promise<void> {
  if (!text) {
    console.warn('[AlgoSync ContentScript] No text provided to speak.');

    return;
  }

  if ('speechSynthesis' in window) {
    return new Promise((resolve, reject) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Optional: Configure utterance
        // utterance.lang = 'en-US';
        // utterance.rate = 1.0;
        // utterance.pitch = 1.0;
        // const voices = window.speechSynthesis.getVoices();
        // if (voices.length > 0) {
        //    utterance.voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
        // }

        utterance.onend = () => {
          console.log('[AlgoSync ContentScript] Speech finished.');
          resolve();
        };
        utterance.onerror = (event) => {
          console.error('[AlgoSync ContentScript] SpeechSynthesisUtterance error:', event.error);
          reject(event.error);
        };

        console.log('[AlgoSync ContentScript] Speaking text:', text);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('[AlgoSync ContentScript] Error in speakTextInPage:', error);
        reject(error);
      }
    });
  } else {
    console.error(
      '[AlgoSync ContentScript] SpeechSynthesis API not supported in this page context.',
    );

    return Promise.reject(new Error('SpeechSynthesis API not supported.'));
  }
}

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
        const audioRequestAction = audioRequestActionSchema.parse({
          action: 'audio',
          audioDataUrl: audioRequest.audioDataUrl,
        });

        chrome.runtime.sendMessage(audioRequestAction);
      },
      false,
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'textToSpeech' && typeof request.text === 'string') {
        speakTextInPage(request.text)
          .then(() => {
            sendResponse({ success: true, message: 'TTS initiated by content script.' });
          })
          .catch((error) => {
            sendResponse({
              success: false,
              error: `TTS failed in content script: ${error.message}`,
            });
          });

        return true; // Indicates asynchronous response
      }
      // Handle other actions if needed
      // sendResponse({ success: false, error: 'Unknown action for content script' });

      return false; // No async response for other actions unless explicitly handled
    });

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

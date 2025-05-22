import pushToGitHub from '@/lib/github';
import { injectCustomScript } from '@/lib/inject';
import {
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

let speechResumeIntervalId: number | null = null;
const SPEECH_RESUME_INTERVAL_DURATION = 14000;

async function speakTextInPage(text: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    return Promise.reject(new Error('SpeechSynthesis API not supported.'));
  }

  return new Promise((resolve, reject) => {
    if (!text) {
      console.warn('[AlgoSync ContentScript] No text provided to speak.');
      if (speechResumeIntervalId !== null) {
        clearInterval(speechResumeIntervalId);
        speechResumeIntervalId = null;
      }
      resolve();

      return;
    }
    try {
      window.speechSynthesis.cancel();
      if (speechResumeIntervalId !== null) {
        clearInterval(speechResumeIntervalId);
        speechResumeIntervalId = null;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice =
          voices.find((v) => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
      }

      utterance.onend = () => {
        if (speechResumeIntervalId !== null) {
          clearInterval(speechResumeIntervalId);
          speechResumeIntervalId = null;
          console.log('[AlgoSync ContentScript] Cleared speech resume interval on utterance end.');
        }
        resolve();
      };

      utterance.onerror = (event) => {
        if (speechResumeIntervalId !== null) {
          clearInterval(speechResumeIntervalId);
          speechResumeIntervalId = null;
        }
        reject(event.error);
      };

      console.log('[AlgoSync Response] Speaking text:', text);
      window.speechSynthesis.speak(utterance);

      speechResumeIntervalId = window.setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          if (speechResumeIntervalId !== null) {
            clearInterval(speechResumeIntervalId);
            speechResumeIntervalId = null;
          }
        } else {
          window.speechSynthesis.resume();
        }
      }, SPEECH_RESUME_INTERVAL_DURATION);
    } catch (error) {
      if (speechResumeIntervalId !== null) {
        clearInterval(speechResumeIntervalId);
        speechResumeIntervalId = null;
      }
      reject(error);
    }
  });
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

        chrome.runtime.sendMessage(audioRequestAction);
      },
      false,
    );

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (textToSpeechRequestActionSchema.safeParse(request).success) {
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

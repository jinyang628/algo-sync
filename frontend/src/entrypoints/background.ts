import { SYSTEM_PROMPT, getLlmApiUrl } from '@/lib/llm';
import { audioRequestActionSchema } from '@/lib/types/audio';
import { audioDataUrlToBase64 } from '@/lib/utils';

async function sendTextToContentScriptForTTS(textToSpeak: string) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      console.log(
        `[AlgoSync Background] Sending text to content script in tab ${activeTab.id} for TTS:`,
        textToSpeak,
      );
      // The content script needs to be listening for this action
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: 'speakTextFromBackground', // New action for content script
          text: textToSpeak,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              '[AlgoSync Background] Error sending TTS message to content script:',
              chrome.runtime.lastError.message,
              "- Is a content script listening on the active tab for 'speakTextFromBackground'?",
            );
          } else {
            console.log(
              '[AlgoSync Background] TTS message acknowledged by content script:',
              response,
            );
          }
        },
      );
    } else {
      console.warn('[AlgoSync Background] No active tab found to send TTS message to.');
    }
  } catch (error) {
    console.error('[AlgoSync Background] Error querying active tab:', error);
  }
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (audioRequestActionSchema.safeParse(request).success) {
      const base64AudioData = audioDataUrlToBase64(request.audioDataUrl);
      const geminiRequestBody = {
        contents: [
          {
            parts: [
              {
                text: SYSTEM_PROMPT,
              },
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64AudioData,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      };

      const geminiApiKey: string = await browser.storage.sync.get('geminiApiKey').then((result) => {
        return result.geminiApiKey;
      });

      console.log('[AlgoSync Background] Sending request to Gemini API...');
      fetch(getLlmApiUrl(geminiApiKey), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequestBody),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((errorBody) => {
              throw new Error(
                `Gemini API request failed with status ${response.status}: ${errorBody.error?.message || response.statusText}`,
              );
            });
          }

          return response.json();
        })
        .then(async (data) => {
          console.log('[AlgoSync Background] Gemini API Success Response:', data);
          let response = 'No response found.';
          if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
          ) {
            response = data.candidates[0].content.parts[0].text;
          }
          try {
            await sendTextToContentScriptForTTS(response); // Call the new helper
            console.log('[AlgoSync Background] TTS initiation message sent to content script.');
            sendResponse({ success: true, response: response, ttsInitiated: true });
          } catch (ttsError: any) {
            console.error(
              '[AlgoSync Background] Error sending TTS message to content script:',
              ttsError,
            );
            sendResponse({
              success: true,
              response: response,
              ttsInitiated: false,
              ttsError: ttsError.message,
            });
          }
        })
        .catch((error) => {
          console.error('[AlgoSync Background] Error calling Gemini API:', error);
          sendResponse({ success: false, error: error.message });
        });

      return true;
    } else {
      console.error('[AlgoSync Background] Received unknown message:', request);

      return false;
    }
  });
});

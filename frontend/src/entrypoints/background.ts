import { getLlmApiUrl, getSystemPrompt } from '@/lib/llm';
import { audioRequestActionSchema, textToSpeechRequestActionSchema } from '@/lib/types/audio';
import { audioDataUrlToBase64 } from '@/lib/utils';

async function sendTextToContentScriptForTTS(textToSpeak: string) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      const textToSpeechRequest = textToSpeechRequestActionSchema.parse({
        action: 'textToSpeech',
        text: textToSpeak,
      });
      chrome.tabs.sendMessage(activeTab.id, textToSpeechRequest);
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
      const prevConversationParts = await browser.storage.local
        .get('prevConversationParts')
        .then((result) => {
          return result.prevConversationParts;
        });

      const base64AudioData = audioDataUrlToBase64(request.audioDataUrl);
      const newParts = [
        {
          text: `User's code so far: ${request.code}`,
        },
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64AudioData,
          },
        },
      ];

      console.log('prevConversationParts', prevConversationParts);

      const mergedRequestBody =
        prevConversationParts &&
        prevConversationParts.contents &&
        prevConversationParts.contents.length > 0
          ? {
              ...prevConversationParts,
              contents: [
                {
                  parts: [...prevConversationParts.contents[0].parts, ...newParts],
                },
              ],
              generationConfig: prevConversationParts.generationConfig,
            }
          : {
              contents: [
                {
                  parts: [
                    {
                      text: getSystemPrompt(request.problemName, request.problemDescription),
                    },
                    ...newParts,
                  ],
                },
              ],
              generationConfig: { temperature: 0.1 },
            };

      const geminiApiKey: string = await browser.storage.sync.get('geminiApiKey').then((result) => {
        return result.geminiApiKey;
      });

      console.log(mergedRequestBody);

      console.log('[AlgoSync Background] Sending request to Gemini API...');
      fetch(getLlmApiUrl(geminiApiKey), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergedRequestBody),
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

          const assistantParts = [{ text: response }];
          const updatedConversation = {
            ...mergedRequestBody,
            contents: [
              {
                parts: [...mergedRequestBody.contents[0].parts, ...assistantParts],
              },
            ],
          };
          await browser.storage.local.set({ prevConversationParts: updatedConversation });

          try {
            await sendTextToContentScriptForTTS(response);
            sendResponse({ success: true, response: response, ttsInitiated: true });
          } catch (ttsError: any) {
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

import { getLlmApiUrl, getSystemPrompt } from '@/lib/llm';
import { audioRequestActionSchema, textToSpeechRequestActionSchema } from '@/lib/types/audio';
import { audioDataUrlToBase64 } from '@/lib/utils';

async function sendTextToContentScriptForTTS(text: string) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id) {
      const textToSpeechRequest = textToSpeechRequestActionSchema.parse({
        action: 'textToSpeech',
        text: text,
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
      (async () => {
        try {
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

          const geminiApiKey: string = await browser.storage.sync
            .get('geminiApiKey')
            .then((result) => {
              return result.geminiApiKey;
            });

          console.log('[AlgoSync Background] Sending request to Gemini API...');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            console.warn('[AlgoSync Background] Gemini API request timed out.');
            controller.abort();
          }, 120000); // 120 seconds timeout
          const response = await fetch(getLlmApiUrl(geminiApiKey), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(mergedRequestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response
              .json()
              .catch(() => ({ error: { message: response.statusText } }));
            throw new Error(
              `Gemini API request failed with status ${response.status}: ${errorBody.error?.message || response.statusText}`,
            );
          }

          const data = await response.json();

          let assistantResponseText = 'No response found.';
          if (
            data.candidates &&
            data.candidates[0] &&
            data.candidates[0].content &&
            data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0]
          ) {
            assistantResponseText = data.candidates[0].content.parts[0].text;
          }

          const assistantParts = [{ text: assistantResponseText }];
          const updatedConversation = {
            ...mergedRequestBody,
            contents: [
              {
                parts: [...mergedRequestBody.contents[0].parts, ...assistantParts],
              },
            ],
          };
          await browser.storage.local.set({ prevConversationParts: updatedConversation });
          sendTextToContentScriptForTTS(assistantResponseText);

          sendResponse({ success: true, response: assistantResponseText, ttsInitiated: true });
        } catch (error: any) {
          console.error('[AlgoSync Background] Error processing audio request:', error);
          if (error.name === 'AbortError') {
            sendResponse({ success: false, error: 'Gemini API request timed out.' });
          } else {
            sendResponse({ success: false, error: error.message });
          }
        }
      })();

      return true;
    } else {
      return false;
    }
  });
});

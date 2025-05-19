import { SYSTEM_PROMPT, getLlmApiUrl } from '@/lib/llm';
import { audioRequestActionSchema } from '@/lib/types/audio';
import { audioDataUrlToBase64 } from '@/lib/utils';

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
            // If response is not OK, read the error body as JSON
            return response.json().then((errorBody) => {
              console.error('[AlgoSync Background] Gemini API Error Response:', errorBody);
              throw new Error(
                `Gemini API request failed with status ${response.status}: ${errorBody.error?.message || response.statusText}`,
              );
            });
          }

          return response.json();
        })
        .then((data) => {
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
          console.log('[AlgoSync Background] Transcription/Summary:', response);
          sendResponse({ success: true, response: response });
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

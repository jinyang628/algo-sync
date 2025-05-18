import { useState } from 'react';

import Loader from '@/components/shared/loader';
import VoiceRecorder from '@/components/voice-recorder';

import { SYSTEM_PROMPT, getLlmApiUrl } from '@/lib/llm';
import { fileToBase64 } from '@/lib/utils';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);

  useEffect(() => {
    browser.storage.sync.get('geminiApiKey').then((result) => {
      setGeminiApiKey(result.geminiApiKey);
    });
  }, []);

  const handleAudioFile = async (audioFile: File) => {
    if (!geminiApiKey) {
      return;
    }

    try {
      setIsLoading(true);
      const base64Audio = await fileToBase64(audioFile);

      const requestBody = {
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: audioFile.type || 'audio/webm',
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      };

      const response = await fetch(getLlmApiUrl(geminiApiKey), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API Error:', data);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      if (
        data.candidates &&
        data.candidates.length > 0 &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0 &&
        data.candidates[0].content.parts[0].text
      ) {
        const transcribedText = data.candidates[0].content.parts[0].text;
        console.log('Transcription:', transcribedText);
      } else {
        console.error('Unexpected response structure from Gemini API:', data);
        throw new Error('Could not extract transcription from Gemini API response.');
      }
    } catch (err: any) {
      console.error('Error sending audio to Gemini:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[250px] w-[250px] flex-col items-center justify-center space-y-3 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <VoiceRecorder
          isDisabled={!geminiApiKey || isLoading}
          onRecordingComplete={handleAudioFile}
        />
      </div>
      <Loader isLoading={isLoading} />
      {!geminiApiKey && (
        <p className="rounded bg-yellow-100 p-2 text-center text-xs text-yellow-600">
          Warning: Please{' '}
          <a
            href="/options.html"
            className="text-blue-500 underline"
            onClick={(e) => {
              e.preventDefault();
              browser.tabs.create({ url: '/options.html' });
            }}
          >
            set
          </a>{' '}
          the Gemini API Key for voice-related features.
        </p>
      )}
    </div>
  );
}

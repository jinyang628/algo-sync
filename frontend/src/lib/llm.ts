export const MODEL_NAME: string = 'gemini-2.5-flash-preview-04-17';
export const getLlmApiUrl = (geminiApiKey: string) => {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${geminiApiKey}`;
};
export const SYSTEM_PROMPT: string = 'Transcribe this audio recording.';

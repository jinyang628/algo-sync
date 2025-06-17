let speechResumeIntervalId: number | null = null;
const SPEECH_RESUME_INTERVAL_DURATION = 14000;

export async function speakTextInPage(text: string): Promise<void> {
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

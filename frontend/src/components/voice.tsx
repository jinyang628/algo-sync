import { audioRequestSchema } from '@/lib/types/audio';
import {
  convertSecondsToTimer,
  extractCodeFromWorkingContainer,
  extractProblemDescription,
  extractProblemNameFromUrl,
} from '@/lib/utils';

export const MIC_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
  <line x1="12" x2="12" y1="18" y2="22"></line>
</svg>`;

export const MIC_OFF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="2" x2="22" y1="2" y2="22" />
  <path d="M18.5 10v2a7 7 0 0 1-11.42 5.46" />
  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3" />
  <path d="M9 9v3a3 3 0 0 0 2.07 2.83" />
  <line x1="12" x2="12" y1="18" y2="22" />
</svg>`;

export const THEME_COLOR = '#8A2BE2';
export const THEME_COLOR_DARKER = '#6B238E';
export const WHITE_COLOR = '#FFFFFF';
export const LIGHT_GRAY_HOVER_BG = '#f0f0f0';

const MESSAGE_SLEEPING_TOOLTIP =
  "LeetCode's editor only renders lines of code that are visible in the viewport. To ensure we capture your entire solution, please make sure all lines of your code are scrolled into view before starting the recording. Resize the window screen or LeetCode's UI components if necessary.";
const MESSAGE_SLEEPING_HTML = `Click to start recording.<br>
  Ensure your code is 
  <span class="tooltip-trigger">fully visible
    <span class="tooltip-text">${MESSAGE_SLEEPING_TOOLTIP}</span>
  </span> 
  in the editor.<br>`;
const MESSAGE_MISSING_API_KEY_HTML = 'Please set your API key in the extension options.';
const MESSAGE_INVALID_API_KEY_HTML =
  'API Key is invalid. Please set a valid API key in the extension options.';
const MESSAGE_WAITING = 'Processing audio... Please wait.';
const MESSAGE_ERROR_GENERAL = 'An error occurred. Please try again.';
const MESSAGE_ERROR_FILEREADER = 'Error reading audio data. Please try again.';
const MESSAGE_ERROR_MEDIARECORDER_PREFIX = 'Recorder error: ';

export interface VoiceButtonControlsAPI {
  updateStateAfterResponse: (options: {
    type: 'Sleeping' | 'Error' | 'MissingApiKeyError' | 'InvalidApiKeyError';
  }) => void;
}

interface CreateVoiceButtonReturn {
  element: HTMLElement;
  controls: VoiceButtonControlsAPI;
}

type RecorderState =
  | 'Sleeping'
  | 'Recording'
  | 'Waiting'
  | 'MissingApiKeyError'
  | 'InvalidApiKeyError'
  | 'Error';

export function createVoiceButton(): CreateVoiceButtonReturn {
  let currentButtonState: RecorderState = 'Sleeping';
  let timerDisplay: string = '00:00';
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let audioChunks: BlobPart[] = [];
  let timerInterval: number | undefined = undefined;

  const voiceUIContainer = document.createElement('div');
  voiceUIContainer.id = 'voice-ui-container';
  voiceUIContainer.style.display = 'flex';
  voiceUIContainer.style.flexDirection = 'column';
  voiceUIContainer.style.alignItems = 'center';
  voiceUIContainer.style.justifyContent = 'center';
  voiceUIContainer.style.gap = '8px';

  const recordButton = document.createElement('button');
  recordButton.id = 'voice-recorder-button';
  recordButton.style.display = 'flex';
  recordButton.style.alignItems = 'center';
  recordButton.style.justifyContent = 'center';
  recordButton.style.border = '1px solid transparent';
  recordButton.style.borderRadius = '50%';
  recordButton.style.width = '48px';
  recordButton.style.height = '48px';
  recordButton.style.padding = '0';
  recordButton.style.cursor = 'pointer';
  recordButton.style.transition =
    'background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.1s';

  const statusText = document.createElement('div');
  statusText.id = 'voice-recorder-status';
  statusText.style.fontSize = '14px';
  statusText.style.textAlign = 'center';
  statusText.style.color = WHITE_COLOR;
  statusText.style.lineHeight = '1.4';

  if (!document.getElementById('algo-sync-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'algo-sync-styles';
    styleElement.textContent = `
      @keyframes algo-sync-pulsate {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      #voice-recorder-button.pulsating {
        transform-origin: center;
        animation: algo-sync-pulsate 1.5s infinite;
      }
      .tooltip-trigger {
        text-decoration: underline dashed ${WHITE_COLOR};
        cursor: help;
        position: relative;
      }
      .tooltip-trigger .tooltip-text {
        visibility: hidden;
        width: 250px;
        background-color: #333;
        color: #fff;
        text-align: left;
        padding: 8px 10px;
        border-radius: 6px;
        position: absolute;
        z-index: 10001;
        bottom: 125%;
        left: 50%;
        margin-left: -125px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 12px;
        line-height: 1.3;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .tooltip-trigger:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
      }
      .tooltip-trigger .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
    `;
    document.head.appendChild(styleElement);
  }

  function updateButtonAppearance() {
    recordButton.disabled = false;
    recordButton.classList.remove('pulsating');
    recordButton.style.animationName = '';

    switch (currentButtonState) {
      case 'Sleeping':
        recordButton.style.backgroundColor = WHITE_COLOR;
        recordButton.style.borderColor = WHITE_COLOR;
        recordButton.innerHTML = MIC_SVG;
        recordButton.style.color = THEME_COLOR;
        statusText.innerHTML = MESSAGE_SLEEPING_HTML;
        recordButton.classList.add('pulsating');
        recordButton.style.animationName = 'algo-sync-pulsate';
        recordButton.onmouseover = () => {
          recordButton.style.backgroundColor = LIGHT_GRAY_HOVER_BG;
        };
        recordButton.onmouseout = () => {
          recordButton.style.backgroundColor = WHITE_COLOR;
        };
        break;

      case 'Recording':
        recordButton.style.backgroundColor = THEME_COLOR_DARKER;
        recordButton.style.borderColor = THEME_COLOR_DARKER;
        recordButton.innerHTML = MIC_OFF_SVG;
        recordButton.style.color = WHITE_COLOR;
        statusText.textContent = timerDisplay;
        recordButton.onmouseover = () => {
          recordButton.style.backgroundColor = THEME_COLOR;
        };
        recordButton.onmouseout = () => {
          recordButton.style.backgroundColor = THEME_COLOR_DARKER;
        };
        break;

      case 'Waiting':
        recordButton.style.backgroundColor = THEME_COLOR_DARKER;
        recordButton.style.borderColor = THEME_COLOR_DARKER;
        recordButton.innerHTML = MIC_OFF_SVG;
        recordButton.style.color = WHITE_COLOR;
        statusText.textContent = MESSAGE_WAITING;
        recordButton.disabled = true;
        recordButton.onmouseover = null;
        recordButton.onmouseout = null;
        break;

      case 'Error':
      case 'MissingApiKeyError':
      case 'InvalidApiKeyError':
        recordButton.style.backgroundColor = WHITE_COLOR;
        recordButton.style.borderColor = WHITE_COLOR;
        recordButton.innerHTML = MIC_SVG;
        recordButton.style.color = THEME_COLOR;
        switch (currentButtonState) {
          case 'MissingApiKeyError':
            statusText.innerHTML = MESSAGE_MISSING_API_KEY_HTML;
            break;
          case 'InvalidApiKeyError':
            statusText.innerHTML = MESSAGE_INVALID_API_KEY_HTML;
            break;
          default:
            statusText.textContent = MESSAGE_ERROR_GENERAL;
        }
        recordButton.onmouseover = () => {
          recordButton.style.backgroundColor = LIGHT_GRAY_HOVER_BG;
        };
        recordButton.onmouseout = () => {
          recordButton.style.backgroundColor = WHITE_COLOR;
        };
        break;
    }
  }

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  // Named function for attaching/detaching MediaRecorder error handler
  const onRecorderError = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    console.error('[AlgoSync] MediaRecorder error:', errorEvent.error || event);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = undefined;
    timerDisplay = '00:00';

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (recorder) {
      recorder.removeEventListener('dataavailable', handleDataAvailable);
      recorder.removeEventListener('stop', handleStop);
      recorder.removeEventListener('Error', onRecorderError); // Remove self
    }
    recorder = null;
    audioChunks = [];

    currentButtonState = 'Error';
    updateButtonAppearance(); // Sets general error message
    statusText.textContent = `${MESSAGE_ERROR_MEDIARECORDER_PREFIX}${errorEvent.error?.message || 'Unknown error'}. Try again.`;

    alert(
      'An error occurred with the media recorder: ' +
        (errorEvent.error?.message || 'Unknown error'),
    );
  };

  const handleStop = () => {
    // MediaRecorder 'stop' event handler
    if (currentButtonState === 'Error') {
      console.warn(
        "[AlgoSync] MediaRecorder 'stop' event handled when state was already 'error'. Ignoring.",
      );
      // Ensure resources are cleaned up if somehow missed, though onRecorderError should handle it.
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = undefined;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      stream = null;
      recorder = null;
      audioChunks = [];

      return;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (currentButtonState !== 'Waiting') {
      console.warn(
        `[AlgoSync] MediaRecorder 'stop' event handled when state was '${currentButtonState}'.`,
      );
      if (audioChunks.length > 0) {
        currentButtonState = 'Waiting';
        updateButtonAppearance();
      } else {
        currentButtonState = 'Sleeping';
        updateButtonAppearance();
        recorder = null;
        audioChunks = [];

        return;
      }
    }

    if (audioChunks.length === 0) {
      console.warn('[AlgoSync] No audio data recorded or chunks are empty in "Waiting" state.');
      currentButtonState = 'Sleeping';
      updateButtonAppearance();
      recorder = null;
      audioChunks = [];

      return;
    }

    const code: string = extractCodeFromWorkingContainer();
    const problemName: string = extractProblemNameFromUrl(window.location.href);
    const problemDescription: string = extractProblemDescription();

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onloadend = () => {
      const audioDataUrl = reader.result as string;
      const audioRequest = audioRequestSchema.parse({
        audioDataUrl: audioDataUrl,
        code,
        problemName,
        problemDescription,
      });
      window.postMessage(
        {
          type: 'ALGO_SYNC_AUDIO_DATA',
          source: 'algo-sync-injected-script',
          payload: audioRequest,
        },
        '*',
      );
    };
    reader.onerror = (error) => {
      console.error('[AlgoSync] FileReader error:', error);
      currentButtonState = 'Error';
      updateButtonAppearance();
      statusText.textContent = MESSAGE_ERROR_FILEREADER;
    };
    reader.readAsDataURL(audioBlob);

    audioChunks = [];
    recorder = null;
  };

  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      currentButtonState = 'Waiting';
      updateButtonAppearance();
      recorder.stop();
    } else {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = undefined;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (recorder) {
        recorder.removeEventListener('dataavailable', handleDataAvailable);
        recorder.removeEventListener('stop', handleStop);
        recorder.removeEventListener('Error', onRecorderError);
      }
      recorder = null;
      audioChunks = [];
      timerDisplay = '00:00';
      currentButtonState = 'Sleeping';
      updateButtonAppearance();
    }
  };

  const startRecording = async () => {
    if (recorder) {
      if (recorder.state === 'recording') recorder.stop(); // Should trigger handleStop eventually
      recorder.removeEventListener('dataavailable', handleDataAvailable);
      recorder.removeEventListener('stop', handleStop);
      recorder.removeEventListener('error', onRecorderError);
      recorder = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    audioChunks = [];
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
    timerDisplay = '00:00';

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      recorder = new MediaRecorder(stream, options);
      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.addEventListener('stop', handleStop);
      recorder.addEventListener('error', onRecorderError);

      recorder.start();
      currentButtonState = 'Recording';
      let seconds = 0;
      updateButtonAppearance();

      timerInterval = window.setInterval(() => {
        seconds++;
        timerDisplay = convertSecondsToTimer(seconds);
        if (currentButtonState === 'Recording') {
          statusText.textContent = timerDisplay;
        } else {
          clearInterval(timerInterval);
          timerInterval = undefined;
        }
      }, 1000);
    } catch (err: any) {
      console.error('[AlgoSync] Error starting recording:', err);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      currentButtonState = 'Sleeping';
      updateButtonAppearance();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone access was denied. Please check your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please ensure one is connected and enabled.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        alert(
          `Could not start recording due to an issue with the microphone: ${err.message}. It might be in use by another application or hardware issues.`,
        );
      } else {
        alert(`Could not start recording: ${err.message}`);
      }
    }
  };

  recordButton.addEventListener('click', () => {
    if (currentButtonState === 'Recording') {
      stopRecording();
    } else if (currentButtonState === 'Sleeping' || currentButtonState === 'Error') {
      startRecording();
    }
  });

  recordButton.addEventListener('mousedown', () => {
    if (recordButton.disabled) return;
    recordButton.style.transform = 'scale(0.92)';
  });
  recordButton.addEventListener('mouseup', () => {
    if (recordButton.disabled) return;
    recordButton.style.transform = 'scale(1)';
    if (recordButton.matches(':hover')) {
      const event = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
      recordButton.dispatchEvent(event);
    }
  });

  const _updateStateAndUIAfterResponse = (options: {
    type: 'Sleeping' | 'Error' | 'MissingApiKeyError' | 'InvalidApiKeyError';
  }) => {
    if (currentButtonState === 'Recording') {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = undefined;
    }
    timerDisplay = '00:00';
    currentButtonState = options.type;
    updateButtonAppearance();
  };

  updateButtonAppearance();

  voiceUIContainer.appendChild(recordButton);
  voiceUIContainer.appendChild(statusText);

  window.addEventListener('beforeunload', () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  return {
    element: voiceUIContainer,
    controls: {
      updateStateAfterResponse: _updateStateAndUIAfterResponse,
    },
  };
}

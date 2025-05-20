import {
  LIGHT_GRAY_HOVER_BG,
  MIC_OFF_SVG,
  MIC_SVG,
  THEME_COLOR,
  THEME_COLOR_DARKER,
  WHITE_COLOR,
} from '@/components/voice';

import { audioRequestSchema } from '@/lib/types/audio';
import {
  convertSecondsToTimer,
  extractCodeFromWorkingContainer,
  extractProblemDescription,
  extractProblemNameFromUrl,
} from '@/lib/utils';

let globalStatusTextUpdater: ((newText: string) => void) | null = null;
let currentResizeHandler: (() => void) | null = null;

function createVoiceButton(): HTMLElement {
  let isRecording: boolean = false;
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

  globalStatusTextUpdater = (newText: string) => {
    statusText.textContent = newText;
  };

  if (!document.getElementById('algo-sync-pulsate-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'algo-sync-pulsate-style';
    styleElement.textContent = `
      @keyframes algo-sync-pulsate {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
        50% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
      }
      #voice-recorder-button.pulsating {
        /* Ensure transform origin is center for scale */
        transform-origin: center;
        animation: algo-sync-pulsate 1.5s infinite;
      }
    `;
    document.head.appendChild(styleElement);
  }

  function updateButtonAppearance() {
    if (isRecording) {
      recordButton.style.backgroundColor = THEME_COLOR_DARKER;
      recordButton.style.borderColor = THEME_COLOR_DARKER;
      recordButton.innerHTML = MIC_OFF_SVG;
      recordButton.style.color = WHITE_COLOR;
      statusText.textContent = timerDisplay;
      recordButton.classList.remove('pulsating');
      recordButton.style.animationName = '';

      recordButton.onmouseover = () => {
        recordButton.style.backgroundColor = THEME_COLOR;
      };
      recordButton.onmouseout = () => {
        recordButton.style.backgroundColor = THEME_COLOR_DARKER;
      };
    } else {
      recordButton.style.backgroundColor = WHITE_COLOR;
      recordButton.style.borderColor = WHITE_COLOR;
      recordButton.innerHTML = MIC_SVG;
      recordButton.style.color = THEME_COLOR;
      statusText.textContent = 'Click to start recording';
      if (!recordButton.classList.contains('pulsating')) {
        recordButton.classList.add('pulsating');
      }
      recordButton.style.animationName = 'algo-sync-pulsate';

      recordButton.onmouseover = () => {
        recordButton.style.backgroundColor = LIGHT_GRAY_HOVER_BG;
      };
      recordButton.onmouseout = () => {
        recordButton.style.backgroundColor = WHITE_COLOR;
      };
    }
  }

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  const handleStop = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }

    isRecording = false;
    timerDisplay = '00:00';

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    updateButtonAppearance();

    if (audioChunks.length === 0) {
      recorder = null;

      return;
    }

    if (globalStatusTextUpdater) {
      globalStatusTextUpdater('Waiting for response. Do not click out of the tab');
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
        code: code,
        problemName: problemName,
        problemDescription: problemDescription,
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
    };
    reader.readAsDataURL(audioBlob);

    audioChunks = [];
    recorder = null;
  };

  const stopRecording = () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    } else {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = undefined;
      isRecording = false;
      timerDisplay = '00:00';
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      audioChunks = [];
      recorder = null;
      updateButtonAppearance();
    }
  };

  const startRecording = async () => {
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
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

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: 'audio/webm' };
      recorder = new MediaRecorder(stream, options);

      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.addEventListener('stop', handleStop);
      recorder.onerror = (event) => {
        console.error('[AlgoSync] MediaRecorder error:', (event as ErrorEvent).error || event);
        if (isRecording) {
          stopRecording();
        }
        alert(
          'An error occurred with the media recorder: ' +
            ((event as ErrorEvent).error?.message || 'Unknown error'),
        );
      };

      recorder.start();
      isRecording = true;

      let seconds = 0;
      timerDisplay = '00:00';
      updateButtonAppearance();

      timerInterval = window.setInterval(() => {
        seconds++;
        timerDisplay = convertSecondsToTimer(seconds);
        if (isRecording) {
          statusText.textContent = timerDisplay;
        }
      }, 1000);
    } catch (err: any) {
      console.error('[AlgoSync] Error starting recording:', err);
      isRecording = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      updateButtonAppearance();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert(
          'Microphone access was denied. Please enable it for this site in your browser settings and for the extension.\n\nTo check extension permissions:\n1. Go to chrome://extensions\n2. Find this extension and click "Details".\n3. Scroll to "Site settings" or "Permissions" and ensure microphone access is allowed for leetcode.com.',
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        alert('No microphone found. Please ensure a microphone is connected and enabled.');
      } else {
        alert(`Could not start recording: ${err.message}`);
      }
    }
  };

  recordButton.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  recordButton.addEventListener('mousedown', () => {
    recordButton.style.transform = 'scale(0.92)';
  });

  recordButton.addEventListener('mouseup', () => {
    recordButton.style.transform = 'scale(1)';
    if (recordButton.matches(':hover')) {
      const event = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
      recordButton.dispatchEvent(event);
    }
  });

  updateButtonAppearance();

  voiceUIContainer.appendChild(recordButton);
  voiceUIContainer.appendChild(statusText);

  window.addEventListener('beforeunload', () => {
    if (isRecording && recorder) {
      recorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  });

  return voiceUIContainer;
}

export default defineUnlistedScript(async () => {
  const initAndInjectVoiceButton = () => {
    const existingContainer = document.getElementById('algo-sync-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    if (currentResizeHandler) {
      window.removeEventListener('resize', currentResizeHandler);
      currentResizeHandler = null;
    }

    const mainFixedContainer = document.createElement('div');
    mainFixedContainer.id = 'algo-sync-container';
    mainFixedContainer.style.position = 'fixed';
    mainFixedContainer.style.top = '50px';
    mainFixedContainer.style.right = '10px';
    mainFixedContainer.style.zIndex = '10000';
    mainFixedContainer.style.width = 'auto';
    mainFixedContainer.style.minWidth = '130px';
    mainFixedContainer.style.height = 'auto';
    mainFixedContainer.style.padding = '12px';
    mainFixedContainer.style.backgroundColor = THEME_COLOR;
    mainFixedContainer.style.borderRadius = '10px';
    mainFixedContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    mainFixedContainer.style.display = 'flex';
    mainFixedContainer.style.flexDirection = 'column';
    mainFixedContainer.style.alignItems = 'center';
    mainFixedContainer.style.justifyContent = 'center';

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    mainFixedContainer.style.cursor = 'move';

    mainFixedContainer.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).closest('#voice-recorder-button')) {
        return;
      }
      isDragging = true;
      const rect = mainFixedContainer.getBoundingClientRect();
      mainFixedContainer.style.left = `${rect.left}px`;
      mainFixedContainer.style.right = 'auto';
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;

      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;

      const visibleMargin = 30;
      const minLeft = -containerWidth + visibleMargin;
      const maxLeft = vw - visibleMargin;
      const minTop = 0;
      const maxTop = vh - visibleMargin;

      newLeft = Math.min(Math.max(newLeft, minLeft), maxLeft);
      newTop = Math.min(Math.max(newTop, minTop), maxTop);

      mainFixedContainer.style.left = `${newLeft}px`;
      mainFixedContainer.style.top = `${newTop}px`;
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    const adjustContainerOnResize = () => {
      if (!mainFixedContainer || !document.body.contains(mainFixedContainer)) {
        window.removeEventListener('resize', adjustContainerOnResize);
        if (currentResizeHandler === adjustContainerOnResize) {
          currentResizeHandler = null;
        }
        
return;
      }

      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const visibleMargin = 30;

      const minTopBoundary = 0;
      const maxTopBoundary = vh - visibleMargin;
      let currentTopPx = parseFloat(mainFixedContainer.style.top);
      if (isNaN(currentTopPx)) {
        currentTopPx = rect.top;
      }
      const newTop = Math.min(Math.max(currentTopPx, minTopBoundary), maxTopBoundary);
      mainFixedContainer.style.top = `${newTop}px`;
      if (mainFixedContainer.style.right !== 'auto' && !isDragging) {
        if (rect.left < -containerWidth + visibleMargin) {
          mainFixedContainer.style.left = `${-containerWidth + visibleMargin}px`;
          mainFixedContainer.style.right = 'auto';
        }
      } else {
        const minLeftBoundary = -containerWidth + visibleMargin;
        const maxLeftBoundary = vw - visibleMargin;

        let currentLeftPx = parseFloat(mainFixedContainer.style.left);
        if (isNaN(currentLeftPx)) {
          currentLeftPx = rect.left;
        }

        const newLeft = Math.min(Math.max(currentLeftPx, minLeftBoundary), maxLeftBoundary);
        mainFixedContainer.style.left = `${newLeft}px`;
        if (mainFixedContainer.style.right !== 'auto') {
          mainFixedContainer.style.right = 'auto';
        }
      }
    };

    currentResizeHandler = adjustContainerOnResize;
    window.addEventListener('resize', currentResizeHandler);

    const voiceInterfaceElement = createVoiceButton();
    mainFixedContainer.appendChild(voiceInterfaceElement);
    document.body.appendChild(mainFixedContainer);

    adjustContainerOnResize();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndInjectVoiceButton);
  } else {
    initAndInjectVoiceButton();
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window && event.origin !== window.location.origin) {
      console.log(
        '[AlgoSync Injected] Ignoring message from different origin/source:',
        event.origin,
      );

      return;
    }

    if (event.data && event.data.type === 'RECORD_BUTTON_STATUS_UPDATE') {
      if (!globalStatusTextUpdater) {
        console.error('[AlgoSync Injected] No global status text updater found');

        return;
      }
      globalStatusTextUpdater(event.data.payload.text);
    }
  });
});

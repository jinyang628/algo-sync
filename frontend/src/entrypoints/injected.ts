import {
  LIGHT_GRAY_HOVER_BG,
  MIC_OFF_SVG,
  MIC_SVG,
  THEME_COLOR,
  THEME_COLOR_DARKER,
  WHITE_COLOR,
} from '@/components/voice';

function createVoiceButton(): HTMLElement {
  let isRecording: boolean = false;
  let timerDisplay: string = '00:00';
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

  recordButton.addEventListener('click', () => {
    isRecording = !isRecording;
    if (isRecording) {
      timerDisplay = '00:05';
    } else {
      timerDisplay = '00:00';
    }
    updateButtonAppearance();
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

  return voiceUIContainer;
}

export default defineUnlistedScript(() => {
  const initAndInjectVoiceButton = () => {
    const existingContainer = document.getElementById('algo-sync-container');
    if (existingContainer) {
      existingContainer.remove();
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

    const voiceInterfaceElement = createVoiceButton();
    mainFixedContainer.appendChild(voiceInterfaceElement);

    document.body.appendChild(mainFixedContainer);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndInjectVoiceButton);
  } else {
    initAndInjectVoiceButton();
  }
});

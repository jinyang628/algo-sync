import { THEME_COLOR, VoiceButtonControlsAPI, createVoiceButton } from '@/components/voice';

let currentResizeHandler: (() => void) | null = null;

export default defineUnlistedScript(async () => {
  let voiceButtonApi: VoiceButtonControlsAPI | null = null;

  const initAndInjectVoiceButton = () => {
    const existingContainer = document.getElementById('algo-sync-container');
    if (existingContainer) existingContainer.remove();
    if (currentResizeHandler) {
      window.removeEventListener('resize', currentResizeHandler);
      currentResizeHandler = null;
    }

    const mainFixedContainer = document.createElement('div');
    mainFixedContainer.id = 'algo-sync-container';
    // ... (styles for mainFixedContainer)
    mainFixedContainer.style.position = 'fixed';
    mainFixedContainer.style.top = '50px';
    mainFixedContainer.style.right = '10px';
    mainFixedContainer.style.zIndex = '10000';
    mainFixedContainer.style.width = 'auto';
    mainFixedContainer.style.minWidth = '130px';
    mainFixedContainer.style.maxWidth = '300px';
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
      if (
        (e.target as HTMLElement).closest('#voice-recorder-button') ||
        (e.target as HTMLElement).closest('.tooltip-trigger')
      )
        return;
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
      /* ... (drag logic) ... */
      if (!isDragging) return;
      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      const visibleMargin = 30;
      newLeft = Math.min(Math.max(newLeft, -containerWidth + visibleMargin), vw - visibleMargin);
      newTop = Math.min(Math.max(newTop, 0), vh - visibleMargin);
      mainFixedContainer.style.left = `${newLeft}px`;
      mainFixedContainer.style.top = `${newTop}px`;
    }
    function onMouseUp() {
      /* ... (drag logic) ... */
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    const adjustContainerOnResize = () => {
      /* ... (resize logic) ... */
      if (!mainFixedContainer || !document.body.contains(mainFixedContainer)) {
        window.removeEventListener('resize', adjustContainerOnResize);
        if (currentResizeHandler === adjustContainerOnResize) currentResizeHandler = null;

        return;
      }
      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const visibleMargin = 30;
      let currentTopPx = parseFloat(mainFixedContainer.style.top);
      if (isNaN(currentTopPx)) currentTopPx = rect.top;
      mainFixedContainer.style.top = `${Math.min(Math.max(currentTopPx, 0), vh - visibleMargin)}px`;
      if (mainFixedContainer.style.right !== 'auto' && !isDragging) {
        if (rect.left < -containerWidth + visibleMargin) {
          mainFixedContainer.style.left = `${-containerWidth + visibleMargin}px`;
          mainFixedContainer.style.right = 'auto';
        }
      } else {
        let currentLeftPx = parseFloat(mainFixedContainer.style.left);
        if (isNaN(currentLeftPx)) currentLeftPx = rect.left;
        mainFixedContainer.style.left = `${Math.min(Math.max(currentLeftPx, -containerWidth + visibleMargin), vw - visibleMargin)}px`;
        if (mainFixedContainer.style.right !== 'auto') mainFixedContainer.style.right = 'auto';
      }
    };
    currentResizeHandler = adjustContainerOnResize;
    window.addEventListener('resize', currentResizeHandler);

    const voiceButtonInstance = createVoiceButton();
    voiceButtonApi = voiceButtonInstance.controls;
    mainFixedContainer.appendChild(voiceButtonInstance.element);
    document.body.appendChild(mainFixedContainer);
    adjustContainerOnResize();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndInjectVoiceButton);
  } else {
    initAndInjectVoiceButton();
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    if (event.data && event.data.type === 'RECORD_BUTTON_STATUS_UPDATE') {
      if (!voiceButtonApi) {
        console.error('[AlgoSync Injected] Voice button API not initialized.');

        return;
      }
      console.log(event.data);

      if (event.data.payload.type === 'sleeping') {
        voiceButtonApi.updateStateAfterResponse({ type: 'sleeping' });
      } else if (event.data.payload.type === 'error') {
        voiceButtonApi.updateStateAfterResponse({ type: 'error' });
      } else {
        console.error('[AlgoSync Injected] Unknown payload type:', event.data.payload.type);
      }
    }
  });
});

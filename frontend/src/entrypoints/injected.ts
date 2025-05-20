import { THEME_COLOR, VoiceButtonControlsAPI, createVoiceButton } from '@/components/voice';

let currentResizeHandler: (() => void) | null = null;
const HORIZONTAL_EDGE_OFFSET = '10px';
const VERTICAL_EDGE_OFFSET = '50px';

export default defineUnlistedScript(async () => {
  let voiceButtonApi: VoiceButtonControlsAPI | null = null;
  let mainFixedContainerRef: HTMLElement | null = null;
  let adjustContainerLayout: (() => void) | null = null;

  const initAndInjectVoiceButton = () => {
    const existingContainer = document.getElementById('algo-sync-container');
    if (existingContainer) existingContainer.remove();
    if (currentResizeHandler) {
      window.removeEventListener('resize', currentResizeHandler);
    }

    const mainFixedContainer = document.createElement('div');
    mainFixedContainer.id = 'algo-sync-container';
    mainFixedContainer.style.position = 'fixed';
    mainFixedContainer.style.top = VERTICAL_EDGE_OFFSET;
    mainFixedContainer.style.right = HORIZONTAL_EDGE_OFFSET;
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
    mainFixedContainer.style.opacity = '0.8';

    mainFixedContainerRef = mainFixedContainer;

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
      mainFixedContainer.style.top = `${rect.top}px`;
      mainFixedContainer.style.right = 'auto';
      mainFixedContainer.style.bottom = 'auto';

      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;
      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;

      const visibleMargin = 30;
      newLeft = Math.min(Math.max(newLeft, -containerWidth + visibleMargin), vw - visibleMargin);
      newLeft = Math.min(Math.max(newLeft, 0), vw - containerWidth);

      newTop = Math.min(Math.max(newTop, 0), vh - containerHeight);

      mainFixedContainer.style.left = `${newLeft}px`;
      mainFixedContainer.style.top = `${newTop}px`;
    }
    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (adjustContainerLayout) {
        adjustContainerLayout();
      }
    }

    const adjustContainerOnResize = () => {
      if (!mainFixedContainer || !document.body.contains(mainFixedContainer)) {
        if (currentResizeHandler) {
          window.removeEventListener('resize', currentResizeHandler);
        }
        if (currentResizeHandler === adjustContainerOnResize) {
          currentResizeHandler = null;
        }
        mainFixedContainerRef = null;
        adjustContainerLayout = null;

        return;
      }
      const rect = mainFixedContainer.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const visibleMargin = 30;
      let targetTop: number;

      if (mainFixedContainer.style.bottom !== 'auto' && mainFixedContainer.style.top === 'auto') {
        targetTop = vh - containerHeight - parseFloat(mainFixedContainer.style.bottom);
      } else {
        targetTop = parseFloat(mainFixedContainer.style.top);
        if (isNaN(targetTop)) {
          targetTop = rect.top;
        }
      }

      const minTopBoundary = 0;
      const maxTopBoundaryBasedOnBottomMargin = vh - containerHeight - visibleMargin;
      const maxTopBoundaryToKeepFullyVisible = vh - containerHeight;

      const effectiveMaxTop = Math.max(
        minTopBoundary,
        Math.min(maxTopBoundaryToKeepFullyVisible, maxTopBoundaryBasedOnBottomMargin),
      );

      const newTop = Math.min(Math.max(targetTop, minTopBoundary), effectiveMaxTop);
      mainFixedContainer.style.top = `${newTop}px`;
      mainFixedContainer.style.bottom = 'auto';
      let targetLeft: number;

      if (mainFixedContainer.style.right !== 'auto' && mainFixedContainer.style.left === 'auto') {
        targetLeft = vw - containerWidth - parseFloat(mainFixedContainer.style.right);
      } else {
        targetLeft = parseFloat(mainFixedContainer.style.left);
        if (isNaN(targetLeft)) {
          targetLeft = rect.left;
        }
      }

      const minLeftBoundary = 0;
      const maxLeftBoundaryBasedOnRightMargin = vw - containerWidth - visibleMargin;
      const maxLeftBoundaryToKeepFullyVisible = vw - containerWidth;

      const effectiveMaxLeft = Math.max(
        minLeftBoundary,
        Math.min(maxLeftBoundaryToKeepFullyVisible, maxLeftBoundaryBasedOnRightMargin),
      );

      const newLeft = Math.min(Math.max(targetLeft, minLeftBoundary), effectiveMaxLeft);
      mainFixedContainer.style.left = `${newLeft}px`;
      mainFixedContainer.style.right = 'auto';
    };

    adjustContainerLayout = adjustContainerOnResize;
    currentResizeHandler = adjustContainerLayout;
    window.addEventListener('resize', currentResizeHandler);

    const voiceButtonInstance = createVoiceButton();
    voiceButtonApi = voiceButtonInstance.controls;
    mainFixedContainer.appendChild(voiceButtonInstance.element);
    document.body.appendChild(mainFixedContainer);

    adjustContainerLayout();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndInjectVoiceButton);
  } else {
    initAndInjectVoiceButton();
  }

  window.addEventListener('keydown', (event) => {
    if (!mainFixedContainerRef || !adjustContainerLayout) {
      return;
    }

    if (event.ctrlKey && event.altKey) {
      let moved = false;
      if (event.key === 'ArrowRight') {
        mainFixedContainerRef.style.left = 'auto';
        mainFixedContainerRef.style.right = HORIZONTAL_EDGE_OFFSET;
        moved = true;
      } else if (event.key === 'ArrowLeft') {
        mainFixedContainerRef.style.left = HORIZONTAL_EDGE_OFFSET;
        mainFixedContainerRef.style.right = 'auto';
        moved = true;
      } else if (event.key === 'ArrowUp') {
        mainFixedContainerRef.style.top = VERTICAL_EDGE_OFFSET;
        mainFixedContainerRef.style.bottom = 'auto';
        moved = true;
      } else if (event.key === 'ArrowDown') {
        mainFixedContainerRef.style.top = 'auto';
        mainFixedContainerRef.style.bottom = VERTICAL_EDGE_OFFSET;
        moved = true;
      }

      if (moved) {
        event.preventDefault();
        adjustContainerLayout();
      }
    }
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }

    if (event.data && event.data.type === 'RECORD_BUTTON_STATUS_UPDATE') {
      if (!voiceButtonApi) {
        console.error('[AlgoSync Injected] Voice button API not initialized.');

        return;
      }
      console.log(event);

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

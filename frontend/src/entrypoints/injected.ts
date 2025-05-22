import { THEME_COLOR, VoiceButtonControlsAPI, createVoiceButton } from '@/components/voice';

let currentResizeHandler: (() => void) | null = null;
const HORIZONTAL_EDGE_OFFSET = '10px';
const VERTICAL_EDGE_OFFSET = '50px';
const ORIGINAL_CONTENT_OPACITY = '0.8';
const GHOST_CONTENT_OPACITY = '0.1';
const GHOST_BUTTON_ID = 'algo-sync-ghost-button';
const GHOST_BUTTON_AREA_HEIGHT = '25px';

export default defineUnlistedScript(async () => {
  let voiceButtonApi: VoiceButtonControlsAPI | null = null;
  let draggableContainerRef: HTMLElement | null = null;
  let contentContainerRef: HTMLElement | null = null;
  let ghostButtonElement: HTMLButtonElement | null = null;
  let isGhostMode = false;
  let adjustLayoutCallback: (() => void) | null = null;

  const updateGhostButtonHorizontalPosition = () => {
    if (!draggableContainerRef || !ghostButtonElement) return;

    const rect = draggableContainerRef.getBoundingClientRect();
    const containerMidX = rect.left + rect.width / 2;
    const screenMidX = window.innerWidth / 2;

    if (containerMidX < screenMidX) {
      ghostButtonElement.style.left = '5px';
      ghostButtonElement.style.right = 'auto';
    } else {
      ghostButtonElement.style.right = '5px';
      ghostButtonElement.style.left = 'auto';
    }
  };

  const toggleGhostMode = () => {
    if (!contentContainerRef || !ghostButtonElement || !draggableContainerRef) return;

    isGhostMode = !isGhostMode;

    if (isGhostMode) {
      contentContainerRef.style.opacity = GHOST_CONTENT_OPACITY;
      contentContainerRef.style.pointerEvents = 'none';
      draggableContainerRef.style.pointerEvents = 'none';

      ghostButtonElement.style.pointerEvents = 'auto';
      ghostButtonElement.textContent = '👁️';
      ghostButtonElement.title = 'Restore container visibility and interaction';
    } else {
      contentContainerRef.style.opacity = ORIGINAL_CONTENT_OPACITY;
      contentContainerRef.style.pointerEvents = 'auto';
      draggableContainerRef.style.pointerEvents = 'auto';

      ghostButtonElement.textContent = '👻';
      ghostButtonElement.title = 'Make container transparent and click-through';
    }
  };

  const initAndInjectVoiceButton = () => {
    const existingDraggableContainer = document.getElementById('algo-sync-draggable-container');
    if (existingDraggableContainer) existingDraggableContainer.remove();

    if (currentResizeHandler) {
      window.removeEventListener('resize', currentResizeHandler);
    }

    const draggableContainer = document.createElement('div');
    draggableContainer.id = 'algo-sync-draggable-container';
    draggableContainer.style.position = 'fixed';
    draggableContainer.style.top = VERTICAL_EDGE_OFFSET;
    draggableContainer.style.right = HORIZONTAL_EDGE_OFFSET;
    draggableContainer.style.zIndex = '10000';
    draggableContainer.style.width = 'auto';
    draggableContainer.style.height = 'auto';
    draggableContainer.style.cursor = 'move';

    draggableContainerRef = draggableContainer;

    const contentContainer = document.createElement('div');
    contentContainer.id = 'algo-sync-content-container';
    contentContainer.style.position = 'relative';
    contentContainer.style.zIndex = '2';
    contentContainer.style.marginTop = GHOST_BUTTON_AREA_HEIGHT;
    contentContainer.style.minWidth = '130px';
    contentContainer.style.maxWidth = '300px';
    contentContainer.style.height = 'auto';
    contentContainer.style.padding = '12px';
    contentContainer.style.backgroundColor = THEME_COLOR;
    contentContainer.style.borderRadius = '10px';
    contentContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.alignItems = 'center';
    contentContainer.style.justifyContent = 'center';
    contentContainer.style.opacity = ORIGINAL_CONTENT_OPACITY;
    contentContainer.style.transition = 'opacity 0.3s ease-in-out';
    contentContainer.style.pointerEvents = 'auto';

    contentContainerRef = contentContainer;
    draggableContainer.appendChild(contentContainer);

    ghostButtonElement = document.createElement('button');
    ghostButtonElement.id = GHOST_BUTTON_ID;
    ghostButtonElement.textContent = '👻';
    ghostButtonElement.title = 'Make container transparent and click-through';
    ghostButtonElement.style.position = 'absolute';
    ghostButtonElement.style.zIndex = '1';
    ghostButtonElement.style.top = '5px';
    ghostButtonElement.style.right = '5px';
    ghostButtonElement.style.left = 'auto';
    ghostButtonElement.style.background = 'rgba(255, 255, 255, 0.7)';
    ghostButtonElement.style.color = 'black';
    ghostButtonElement.style.border = '1px solid rgba(0,0,0,0.3)';
    ghostButtonElement.style.borderRadius = '5px';
    ghostButtonElement.style.padding = '2px 5px';
    ghostButtonElement.style.fontSize = '12px';
    ghostButtonElement.style.cursor = 'pointer';
    ghostButtonElement.style.lineHeight = '1';
    ghostButtonElement.style.opacity = '1';
    ghostButtonElement.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGhostMode();
    });
    draggableContainer.appendChild(ghostButtonElement);
    isGhostMode = false;

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    draggableContainer.addEventListener('mousedown', (e) => {
      if (
        (e.target as HTMLElement).closest('#voice-recorder-button') ||
        (e.target as HTMLElement).closest('.tooltip-trigger') ||
        (e.target as HTMLElement).closest(`#${GHOST_BUTTON_ID}`)
      ) {
        return;
      }

      isDragging = true;
      const rect = draggableContainer.getBoundingClientRect();
      draggableContainer.style.left = `${rect.left}px`;
      draggableContainer.style.top = `${rect.top}px`;
      draggableContainer.style.right = 'auto';
      draggableContainer.style.bottom = 'auto';

      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e: MouseEvent) {
      if (!isDragging || !draggableContainerRef) return;
      const rect = draggableContainerRef.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;

      newLeft = Math.max(0, newLeft);
      newLeft = Math.min(vw - containerWidth, newLeft);
      newTop = Math.max(0, newTop);
      newTop = Math.min(vh - containerHeight, newTop);

      draggableContainerRef.style.left = `${newLeft}px`;
      draggableContainerRef.style.top = `${newTop}px`;
    }

    const adjustContainerOnResize = () => {
      if (!draggableContainerRef || !document.body.contains(draggableContainerRef)) {
        if (currentResizeHandler) {
          window.removeEventListener('resize', currentResizeHandler);
          currentResizeHandler = null;
        }
        draggableContainerRef = null;
        contentContainerRef = null;
        ghostButtonElement = null;
        adjustLayoutCallback = null;

        return;
      }
      const rect = draggableContainerRef.getBoundingClientRect();
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let currentTop = parseFloat(draggableContainerRef.style.top);
      if (isNaN(currentTop) || draggableContainerRef.style.top === 'auto') currentTop = rect.top;
      const newTop = Math.min(Math.max(0, currentTop), vh - containerHeight);
      draggableContainerRef.style.top = `${newTop}px`;
      draggableContainerRef.style.bottom = 'auto';
      let currentLeft = parseFloat(draggableContainerRef.style.left);
      if (isNaN(currentLeft) || draggableContainerRef.style.left === 'auto')
        currentLeft = rect.left;
      const newLeft = Math.min(Math.max(0, currentLeft), vw - containerWidth);
      draggableContainerRef.style.left = `${newLeft}px`;
      draggableContainerRef.style.right = 'auto';

      updateGhostButtonHorizontalPosition();
    };

    adjustLayoutCallback = adjustContainerOnResize;
    currentResizeHandler = adjustLayoutCallback;
    window.addEventListener('resize', currentResizeHandler);

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (adjustLayoutCallback) {
        adjustLayoutCallback();
      }
    }

    const voiceButtonInstance = createVoiceButton();
    voiceButtonApi = voiceButtonInstance.controls;
    contentContainer.appendChild(voiceButtonInstance.element);

    document.body.appendChild(draggableContainer);
    if (adjustLayoutCallback) {
      adjustLayoutCallback();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndInjectVoiceButton);
  } else {
    initAndInjectVoiceButton();
  }

  window.addEventListener('keydown', (event) => {
    if (!draggableContainerRef || !adjustLayoutCallback) {
      return;
    }
    if (event.ctrlKey && event.altKey) {
      let moved = false;
      if (event.key === 'ArrowRight') {
        draggableContainerRef.style.left = 'auto';
        draggableContainerRef.style.right = HORIZONTAL_EDGE_OFFSET;
        moved = true;
      } else if (event.key === 'ArrowLeft') {
        draggableContainerRef.style.left = HORIZONTAL_EDGE_OFFSET;
        draggableContainerRef.style.right = 'auto';
        moved = true;
      } else if (event.key === 'ArrowUp') {
        draggableContainerRef.style.top = VERTICAL_EDGE_OFFSET;
        draggableContainerRef.style.bottom = 'auto';
        moved = true;
      } else if (event.key === 'ArrowDown') {
        draggableContainerRef.style.top = 'auto';
        draggableContainerRef.style.bottom = VERTICAL_EDGE_OFFSET;
        moved = true;
      }
      if (moved) {
        event.preventDefault();
        adjustLayoutCallback();
      }
    }
  });

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    if (event.data && event.data.type === 'RECORD_BUTTON_STATUS_UPDATE') {
      console.log('Received message:', event.data);
      if (!voiceButtonApi) {
        console.error('[AlgoSync Injected] Voice button API not initialized.');

        return;
      }
      voiceButtonApi.updateStateAfterResponse({
        type: event.data.payload.type,
      });
    }
  });
});

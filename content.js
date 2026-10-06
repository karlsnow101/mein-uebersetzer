(() => {
  const POSITION_KEY = 'mein-uebersetzer-position';
  let panel = null;
  let hideTimer = null;
  let requestId = 0;
  let drag = null;
  let lastSelectedText = '';

  function getSelectedText() { return window.getSelection()?.toString().trim() || ''; }

  function hidePanel() {
    if (panel) panel.style.display = 'none';
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function clampPanel() {
    if (!panel) return;
    const margin = 12;
    const maxWidth = Math.max(180, innerWidth - margin * 2);
    panel.style.maxWidth = `${maxWidth}px`;
    panel.style.maxHeight = `${Math.max(100, innerHeight - margin * 2)}px`;
    const rect = panel.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    if (rect.right > innerWidth - margin) left -= rect.right - (innerWidth - margin);
    if (rect.left < margin) left += margin - rect.left;
    if (rect.bottom > innerHeight - margin) top -= rect.bottom - (innerHeight - margin);
    if (rect.top < margin) top += margin - rect.top;
    panel.style.left = `${Math.max(margin, left)}px`;
    panel.style.top = `${Math.max(margin, top)}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function applySavedPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
      if (!saved || !panel) return;
      panel.style.left = `${saved.left}px`;
      panel.style.top = `${saved.top}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      clampPanel();
    } catch {}
  }

  function startDrag(event) {
    if (!panel || event.button !== 0) return;
    const rect = panel.getBoundingClientRect();
    drag = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    panel.classList.add('dragging');
    event.preventDefault();
  }

  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    panel.style.left = `${event.clientX - drag.offsetX}px`;
    panel.style.top = `${event.clientY - drag.offsetY}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    clampPanel();
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    const rect = panel.getBoundingClientRect();
    localStorage.setItem(POSITION_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
    panel.classList.remove('dragging');
    drag = null;
  }

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'mein-uebersetzer-panel';
    panel.innerHTML = '<div class="mein-uebersetzer-handle" title="Ziehen zum Verschieben">⠿ Übersetzung</div><div class="mein-uebersetzer-text"></div>';
    document.documentElement.appendChild(panel);
    const handle = panel.querySelector('.mein-uebersetzer-handle');
    handle.addEventListener('pointerdown', startDrag);
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    applySavedPosition();
  }

  function showPanel(text) {
    ensurePanel();
    panel.querySelector('.mein-uebersetzer-text').textContent = text;
    panel.style.display = 'block';
    clampPanel();
  }

  function requestTranslation(text) {
    const currentRequest = ++requestId;
    chrome.runtime.sendMessage({ type: 'translate', text }, response => {
      if (currentRequest !== requestId) return;
      if (chrome.runtime.lastError || !response || response.skip || response.error) {
        hidePanel();
        return;
      }
      if (getSelectedText() !== text) {
        hidePanel();
        return;
      }
      if (response.translation) showPanel(response.translation);
    });
  }

  document.addEventListener('selectionchange', () => {
    const selected = getSelectedText();
    if (!selected) {
      requestId++;
      lastSelectedText = '';
      hidePanel();
      return;
    }
    if (selected !== lastSelectedText) {
      lastSelectedText = selected;
      requestTranslation(selected);
    }
  });

  document.addEventListener('mouseup', () => {
    const selected = getSelectedText();
    if (selected && selected !== lastSelectedText) {
      lastSelectedText = selected;
      requestTranslation(selected);
    }
  });

  document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePanel(); });
  window.addEventListener('resize', clampPanel);
})();

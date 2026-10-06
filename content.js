(() => {
  const HIDE_AFTER_MS = 5000;
  const POSITION_KEY = 'mein-uebersetzer-position';
  let panel = null;
  let hideTimer = null;
  let drag = null;

  function hidePanel() {
    if (panel) panel.style.display = 'none';
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function applySavedPosition() {
    try {
      const saved = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
      if (!saved || !panel) return;
      panel.style.left = `${Math.max(0, Math.min(saved.left, innerWidth - panel.offsetWidth))}px`;
      panel.style.top = `${Math.max(0, Math.min(saved.top, innerHeight - panel.offsetHeight))}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
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
    const left = Math.max(0, Math.min(innerWidth - panel.offsetWidth, event.clientX - drag.offsetX));
    const top = Math.max(0, Math.min(innerHeight - panel.offsetHeight, event.clientY - drag.offsetY));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
  }

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
    localStorage.setItem(POSITION_KEY, JSON.stringify({ left: panel.offsetLeft, top: panel.offsetTop }));
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
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hidePanel, HIDE_AFTER_MS);
  }

  document.addEventListener('mouseup', () => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) return;
    chrome.runtime.sendMessage({ type: 'translate', text: selected }, response => {
      if (chrome.runtime.lastError || !response || response.skip || response.error) { hidePanel(); return; }
      if (response.translation) showPanel(response.translation);
    });
  });

  document.addEventListener('keydown', event => { if (event.key === 'Escape') hidePanel(); });
  window.addEventListener('resize', () => { if (panel && panel.style.left) applySavedPosition(); });
})();

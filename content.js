(() => {
  const HIDE_AFTER_MS = 5000;
  let panel = null;
  let hideTimer = null;

  function hidePanel() {
    if (panel) panel.style.display = 'none';
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function showPanel(text) {
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'mein-uebersetzer-panel';
      panel.style.cssText = [
        'position:fixed', 'right:20px', 'bottom:20px', 'z-index:2147483647',
        'max-width:360px', 'padding:12px 16px', 'border-radius:10px',
        'background:#171a21', 'color:#f2f4f8', 'font:15px/1.45 system-ui,sans-serif',
        'box-shadow:0 8px 28px rgba(0,0,0,.35)', 'cursor:move'
      ].join(';');
      document.documentElement.appendChild(panel);
    }
    panel.textContent = text;
    panel.style.display = 'block';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hidePanel, HIDE_AFTER_MS);
  }

  document.addEventListener('mouseup', async () => {
    const selected = window.getSelection()?.toString().trim();
    if (!selected) return;

    chrome.runtime.sendMessage({ type: 'translate', text: selected }, response => {
      if (chrome.runtime.lastError || !response) return;
      if (response.skip || response.error) {
        hidePanel();
        return;
      }
      if (response.translation) showPanel(response.translation);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hidePanel();
  });
})();

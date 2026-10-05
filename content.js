const panel = document.createElement("div");
panel.id = "mein-uebersetzer-panel";
panel.setAttribute("role", "status");
panel.setAttribute("aria-live", "polite");
panel.innerHTML = `
  <div class="mu-header" id="mu-drag-handle">
    <span class="mu-title">DE</span>
    <button id="mu-close" type="button" title="Schließen" aria-label="Schließen">×</button>
  </div>
  <div class="mu-result">Text markieren…</div>
`;
document.documentElement.appendChild(panel);

const resultBox = panel.querySelector(".mu-result");
const closeButton = document.getElementById("mu-close");
const dragHandle = document.getElementById("mu-drag-handle");

const AUTO_HIDE_MS = 10000;
const POSITION_KEY = "panelPosition";

let hideTimer = null;
let currentTranslation = "";
let currentSourceText = "";
let isDragging = false;
let hasMoved = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastText = "";

function clampPosition(left, top) {
  const panelWidth = panel.offsetWidth || 240;
  const panelHeight = panel.offsetHeight || 80;

  const maxLeft = Math.max(0, window.innerWidth - panelWidth);
  const maxTop = Math.max(0, window.innerHeight - panelHeight);

  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop)
  };
}

function applyPosition(position) {
  if (
    typeof position?.left !== "number" ||
    typeof position?.top !== "number" ||
    !Number.isFinite(position.left) ||
    !Number.isFinite(position.top)
  ) {
    return;
  }

  const safePosition = clampPosition(position.left, position.top);

  panel.style.left = `${safePosition.left}px`;
  panel.style.top = `${safePosition.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
}

async function savePosition() {
  if (!hasMoved) return;

  const rect = panel.getBoundingClientRect();
  const position = clampPosition(rect.left, rect.top);

  try {
    await chrome.storage.local.set({ [POSITION_KEY]: position });
  } catch {
    // Speichern ist optional.
  }
}

async function restorePosition() {
  try {
    const result = await chrome.storage.local.get(POSITION_KEY);
    applyPosition(result[POSITION_KEY]);
  } catch {
    // Standardposition bleibt aktiv.
  }
}

function showPanel() {
  panel.classList.add("mu-visible");

  clearTimeout(hideTimer);
  hideTimer = setTimeout(hidePanel, AUTO_HIDE_MS);
}

function hidePanel() {
  panel.classList.remove("mu-visible");
  clearTimeout(hideTimer);
}

async function copyToClipboard() {
  if (!currentSourceText || !currentTranslation) return;

  const textToCopy = `${currentSourceText} = ${currentTranslation}`;

  try {
    await navigator.clipboard.writeText(textToCopy);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = textToCopy;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}

closeButton.addEventListener("click", hidePanel);

dragHandle.addEventListener("mousedown", event => {
  if (event.target === closeButton) return;

  isDragging = true;
  hasMoved = false;

  const rect = panel.getBoundingClientRect();

  dragOffsetX = event.clientX - rect.left;
  dragOffsetY = event.clientY - rect.top;

  event.preventDefault();
});

document.addEventListener("mousemove", event => {
  if (!isDragging) return;

  hasMoved = true;

  const position = clampPosition(
    event.clientX - dragOffsetX,
    event.clientY - dragOffsetY
  );

  panel.style.left = `${position.left}px`;
  panel.style.top = `${position.top}px`;
  panel.style.right = "auto";
  panel.style.bottom = "auto";
});

document.addEventListener("mouseup", async event => {
  if (isDragging) {
    isDragging = false;
    await savePosition();
    return;
  }

  const selected = window.getSelection().toString().trim();

  if (!selected || selected === lastText) return;

  lastText = selected;

  showPanel();
  resultBox.textContent = "…";
  currentTranslation = "";
  currentSourceText = "";

  try {
    const response = await chrome.runtime.sendMessage({
      type: "translate",
      text: selected
    });

    if (!response?.ok || typeof response.translation !== "string") {
      resultBox.textContent = "Übersetzung fehlgeschlagen.";
      return;
    }

    currentSourceText = selected;
    currentTranslation = response.translation;
    resultBox.textContent = currentTranslation;

    await copyToClipboard();
  } catch {
    resultBox.textContent = "Übersetzung fehlgeschlagen.";
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    hidePanel();
  }
});

restorePosition();

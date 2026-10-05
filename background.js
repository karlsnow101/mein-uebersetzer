chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "translate") return;

  translateToGerman(message.text)
    .then(translation => sendResponse({ ok: true, translation }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});

async function translateToGerman(text) {
  // sl=auto: Google erkennt die Quellsprache automatisch.
  // Britisches und amerikanisches Englisch werden beide als "en" erkannt.
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    "?client=gtx&sl=auto&tl=de&dt=t&q=" +
    encodeURIComponent(text);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Translation request failed");
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected translation response");
  }

  return data[0]
    .map(part => Array.isArray(part) && typeof part[0] === "string" ? part[0] : "")
    .join("");
}

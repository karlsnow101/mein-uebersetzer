const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

function detectLanguage(text) {
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(text)}`;
  return fetch(url).then(response => {
    if (!response.ok) throw new Error('language detection failed');
    return response.json();
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'translate' || typeof message.text !== 'string') return;

  (async () => {
    try {
      const data = await detectLanguage(message.text);
      const detectedLanguage = data?.[2];
      if (detectedLanguage === 'de') {
        sendResponse({ skip: true });
        return;
      }

      const translation = Array.isArray(data?.[0])
        ? data[0].map(item => item?.[0] || '').join('')
        : '';
      if (!translation) throw new Error('empty translation');
      sendResponse({ translation });
    } catch {
      sendResponse({ error: true });
    }
  })();

  return true;
});

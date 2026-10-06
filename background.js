const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

function translate(text) {
  const url = `${TRANSLATE_ENDPOINT}?client=gtx&sl=auto&tl=de&dt=t&q=${encodeURIComponent(text)}`;
  return fetch(url).then(response => {
    if (!response.ok) throw new Error('translation request failed');
    return response.json();
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'translate' || typeof message.text !== 'string') return;
  translate(message.text).then(data => {
    if (data?.[2] === 'de') {
      sendResponse({ skip: true });
      return;
    }
    const translation = Array.isArray(data?.[0])
      ? data[0].map(item => item?.[0] || '').join('')
      : '';
    sendResponse(translation ? { translation } : { error: true });
  }).catch(() => sendResponse({ error: true }));
  return true;
});

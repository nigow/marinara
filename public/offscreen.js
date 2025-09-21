const playing = new Map();

async function playAudio(file) {
  const url = chrome.runtime.getURL(file.replace(/^\//, ''));
  const audio = new Audio(url);
  audio.volume = 1;

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      playing.delete(audio);
    };

    const onEnded = () => {
      cleanup();
      resolve();
    };

    const onError = event => {
      cleanup();
      reject(event?.error || new Error('Failed to play audio.'));
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    playing.set(audio, { resolve, reject });
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(onError);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'offscreen-play-audio') {
    return;
  }

  playAudio(message.file).then(() => {
    sendResponse({ ok: true });
  }).catch(error => {
    console.error(error);
    sendResponse({ error: String(error) });
  });

  return true;
});

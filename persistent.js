// console.log('Persistent tab script loaded.');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'playAudio') {
        const audio = new Audio(chrome.runtime.getURL('assets/audios/bell.mp3'));
        audio.play().then(() => {
            // console.log('Audio played successfully.');
            sendResponse({ status: 'audioPlayed' });
        }).catch((error) => {
            // console.error('Failed to play audio:', error);
            sendResponse({ status: 'audioFailed' });
        });
    }
    return true; // Keep the message channel open for sendResponse
});

// console.log('Content script injected!');

const playAudio = () => {
    const audio = new Audio(chrome.runtime.getURL('assets/audios/bell.mp3'));
    audio.play().then(() => {
        // console.log('Audio played successfully.');
    }).catch((error) => {
        // console.error('Failed to play audio:', error);
    });
};

playAudio();

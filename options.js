document.getElementById('clear-theme').addEventListener('click', () => {
    chrome.storage.local.remove('theme', () => {
        if (chrome.runtime.lastError) {
            // console.error('Error removing items:', chrome.runtime.lastError);
        } else {
            // console.log('Preset theme have been removed');
        }
    });
});

document.getElementById('clear-all').addEventListener('click', () => {
    chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
            // console.error('Error clearing storage:', chrome.runtime.lastError);
        } else {
            // console.log('All storage items have been removed');
        }
    });
});

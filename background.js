let timer = null;
let progressCircleTimer = null;
// let remainingTime = 25; // default 25 seconds for testing
let remainingTime = 25 * 60; // default 25 minutes
let isTimerRunning = false;
let isProgressCircleTimerRunning = false;
let isCycleComplete = false;
let isBreakTime = false;
let setInputTime = 25;
let percent = 0;
let playAudio = false;
let previousAudioVolume = 95;
let currentAudioVolume = 95;
let buttonState = "initialOrRestart";

// let persistentTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "start") {
        if (!isTimerRunning) {
            isTimerRunning = true;
            isCycleComplete = false;
            playAudio = false;
            buttonState = "running";
            
            /*
            // Clear existing alarm
            chrome.alarms.clear('pomodoroAlarm');

            // Set the alarm to trigger when the timer ends
            chrome.alarms.create('pomodoroAlarm', {
                delayInMinutes: remainingTime/60
                // delayInMinutes: request.timeInMinutes // Calculate this based on remaining time
            });
            */

            timer = setInterval(() => {
                remainingTime -= 1;

                // Check for 30 seconds or 1-minute remaining notification
                if (remainingTime === 60 || remainingTime === 30) {
                    chrome.notifications.create('', {
                        type: 'basic',
                        iconUrl: './assets/images/icon-timer-64.png',
                        title: 'Pomodoro Timer',
                        message: remainingTime === 60 ? '1 minute remaining!' : '30 seconds remaining!',
                        priority: 2
                    }, (notificationId) => {
                        // console.log("Notification displayed with ID:", notificationId);
                    });
                }

                if (remainingTime <= 0) {
                    clearInterval(timer);
                    isTimerRunning = false;
                    isCycleComplete = true;

                    // play audio and show notification
                    chrome.notifications.create('', {
                        type: 'basic',
                        iconUrl: 'assets/images/icon-timer-64.png',
                        title: 'Pomodoro Timer',
                        message: 'Time is up!',
                        priority: 2
                    }, (notificationId) => {
                        // console.log("Notification displayed with ID:", notificationId);
                    });

                    isBreakTime = isBreakTime === true ? false : true; // toggle focus and break buttons
                    let time = isBreakTime ? 5 : 25;
                    setInputTime = time;
                    // remainingTime = parseInt(time);
                    remainingTime = parseInt(time)*60; // reset to default cycle time
                    buttonState = 'initialOrRestart';
                }

                // update timerdisplay as well as cycle change 
                chrome.runtime.sendMessage({ action: "updateTimer", isTimerRunning: isTimerRunning, remainingTime: remainingTime, isCycleComplete: isCycleComplete, isBreakTime: isBreakTime, buttonState: buttonState }, (response) => {
                    if (chrome.runtime.lastError) {
                        // console.error(chrome.runtime.lastError.message);
                        // console.log("The PopUp Window is not active! Couldn't establish connection Error");
                    } else if (response) {
                        // console.log('Received response from popup:', response.status);
                        // Handle the response
                    } else {
                        // console.error('No response received from popup');
                    }
                });
            }, 1000);
        }

        if (!isProgressCircleTimerRunning) {
            isProgressCircleTimerRunning = true;
    
            // Setting interval for progress bar
            progressCircleTimer = setInterval(()=>{
                if (percent >= 100) {
                    clearInterval(progressCircleTimer);
                    isProgressCircleTimerRunning = false;
                    // Play audio sound when the timer ends
                    // audio.play();
                    playAudio = true;
                    percent = 0;
                    // call updateProgressCircleDisplay(percent);
                } else {
                    let totalTime = setInputTime*60;
                    percent += (100 / totalTime) / 10;
                    // call updateProgressCircleDisplay(percent);
                }

                chrome.runtime.sendMessage({ action: "updateProgressCircle", isTimerRunning: isTimerRunning, remainingTime: remainingTime, isCycleComplete: isCycleComplete, isBreakTime: isBreakTime, percent: percent, playAudio: playAudio }, (response) => {
                    if (chrome.runtime.lastError) {
                        // console.error(chrome.runtime.lastError.message);
                        // console.log("The PopUp Window is not active! Couldn't establish connection Error");
                    } else if (response) {
                        // console.log('Received response from popup:', response.status);
                        // Handle the response
                    } else {
                        // console.error('No response received from popup');
                    }
                });
            }, 100);
        }

        sendResponse({status: "started"});

        // return true; to indicate an asynchronous response
    } 
    else if (request.action === "stop") {
        clearInterval(timer);
        clearInterval(progressCircleTimer);
        isTimerRunning = false;
        isProgressCircleTimerRunning = false;
        isCycleComplete = false;
        buttonState = "stopped";
        sendResponse({status: 'stopped'});
    } 
    else if (request.action === "reset") {
        clearInterval(timer);
        clearInterval(progressCircleTimer);
        isTimerRunning = false;
        isProgressCircleTimerRunning = false;
        isCycleComplete = false;
        let time = isBreakTime ? 5 : 25;
        // remainingTime = parseInt(time);
        remainingTime = parseInt(time)*60; 
        setInputTime = time;
        percent = 0;
        playAudio = false;
        buttonState = "initialOrRestart";
        sendResponse({status: "reset", isBreakTime: isBreakTime});
    } 
    else if (request.action === "getStatus") {
        // include all the button status values
        sendResponse({ status: "getStatusInfo", isTimerRunning: isTimerRunning, remainingTime: remainingTime, isCycleComplete: isCycleComplete, isBreakTime: isBreakTime, setInputTime: setInputTime, percent: percent, playAudio: playAudio, previousAudioVolume: previousAudioVolume, currentAudioVolume: currentAudioVolume, buttonState: buttonState });
    }
    else if (request.action === "updateBreakTime"){
        isBreakTime = request.breakTime;
        let time = isBreakTime ? 5 : 25;
        // remainingTime = parseInt(time);
        remainingTime = parseInt(time)*60; 
        setInputTime = time;
        percent = 0; // by default it will be 0 after cycle completion or after reset
        sendResponse({ status: ( isBreakTime ? "Toggled to break time" : "Toggled to focus time" ), remainingTime: remainingTime});
    }
    else if (request.action === "increaseTime" ){
        // remainingTime = parseInt(request.time);
        remainingTime = parseInt(request.time)*60;
        setInputTime = request.time;
        percent = 0; // by default it will be 0 as timer is increased from reset state
        sendResponse({ status: "Increased Time" });
    }
    else if (request.action === "decreaseTime"){
        // remainingTime = parseInt(request.time);
        remainingTime = parseInt(request.time)*60;
        setInputTime = request.time;
        percent = 0; // by default it will be 0 as timer is increased from reset state
        sendResponse({ status: "Decreased Time" });
    }
    else if (request.action === "setInputTime"){
        setInputTime = request.time;
        // remainingTime = parseInt(request.time);
        remainingTime = parseInt(request.time)*60;
        percent = 0; // by default it will be 0 as timer is increased from reset state
        sendResponse({ status: "Set Input Time" });
    }
    else if (request.action === "updateAudioControls"){
        previousAudioVolume = request.previousAudioVolume;
        currentAudioVolume = request.currentAudioVolume;
        chrome.storage.local.set({ currentAudioVolume : request.currentAudioVolume, previousAudioVolume: request.previousAudioVolume }).then(() => {
            // console.log("Current and Previous audio volume values are set");
        });
        sendResponse({ status: "Updated Audio Controls" });
    }
    // Return true to indicate you will respond asynchronously 
    // to prevent the message channel from closing prematurely without sending Response
    return true;
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        /*
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
        */
    }
});


/*
function createOrFocusPersistentTab(callback) {
    if (persistentTabId === null) {
        chrome.tabs.create({
            url: chrome.runtime.getURL('persistent.html'),
            active: false, // Keep the tab inactive
            pinned: true   // Optionally pin the tab to prevent accidental closure
        }, (tab) => {
            persistentTabId = tab.id;
            waitForTabLoad(persistentTabId, callback);
        });
    } else {
        chrome.tabs.get(persistentTabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
                // If the tab no longer exists, create it again
                chrome.tabs.create({
                    url: chrome.runtime.getURL('persistent.html'),
                    active: false,
                    pinned: true
                }, (newTab) => {
                    persistentTabId = newTab.id;
                    waitForTabLoad(persistentTabId, callback);
                });
            } else {
                // If the tab exists, do nothing or activate it if needed
                waitForTabLoad(persistentTabId, callback);
            }
        });
    }
}

// Wait for the tab to be fully loaded before sending the message
function waitForTabLoad(tabId, callback) {
    chrome.tabs.onUpdated.addListener(function listener(tabIdUpdated, info) {
        if (tabId === tabIdUpdated && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            if (callback) callback();
        }
    });
}

function sendMessageToPersistentTab(message) {
    createOrFocusPersistentTab(() => {
        if (persistentTabId !== null) {
            chrome.tabs.sendMessage(persistentTabId, message, (response) => {
                if (chrome.runtime.lastError) {
                    // console.error('Error sending message to persistent tab:', chrome.runtime.lastError);
                } else {
                    // console.log('Message sent to persistent tab:', response);
                }
            });
        }
    });
}
*/

// Function to inject a script into the active tab to play audio
/*
function playAudioInActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content-script.js"]  // Inject the content script file
            }, () => {
                // console.log('Content script injected.');
            });
        } else {
            // console.error('No active tab found to inject the script.');
        }
    });
}
*/

// Listen for the alarm
/*
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        chrome.notifications.create('pomodoroAlarmNotification', {
            type: 'basic',
            iconUrl: 'assets/images/icon-timer-64.png',
            title: 'Pomodoro Timer',
            message: 'Time is up!',
            priority: 2
        }, (notificationId) => {
            // console.log("Notification displayed with ID:", notificationId);
        });

        // Chrome's autoplay restricting both approaches, unless triggered by a user interaction (e.g., notification click).
        // playAudioInActiveTab(); couldn't bypass chrome's autoplay block
        // Send a message to the persistent tab to play audio
        // sendMessageToPersistentTab({ action: 'playAudio' });
    }
});
*/

/*
chrome.runtime.onStartup.addListener(() => {
    chrome.alarms.clearAll();
});

chrome.runtime.onSuspend.addListener(() => {
    chrome.alarms.clearAll();
});
*/



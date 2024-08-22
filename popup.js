document.addEventListener('DOMContentLoaded', () => {
    const breakBtn = document.getElementById('break-btn');
    const focusBtn = document.getElementById('focus-btn');
    const setTimeInput = document.getElementById('set-time');
    const increaseTimeBtn = document.getElementById('increase-time');
    const decreaseTimeBtn = document.getElementById('decrease-time');
    const startStopBtn = document.getElementById('start-stop-btn');
    const resetBtn = document.getElementById('reset-btn');
    const timeDisplay = document.getElementById('time-display');
    const progressCircle = document.querySelector('#progress-ring-circle');

    const audio = document.getElementById('timer-end-sound');
    const muteButton = document.querySelector('.volume-mute-button');
    const volumeSlider = document.querySelector('.volume-slider');
    const volumeOnPath = document.getElementById('volume-on');
    const volumeOffPath = document.getElementById('volume-off');
    const dropdownHeader = document.querySelector('.dropdown-header');
    const dropdownContent = document.querySelector('#dropdownContent');
   

    const RADIUS = progressCircle.r.baseVal.value;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS; 
    progressCircle.style.strokeDasharray = CIRCUMFERENCE;
    progressCircle.style.strokeDashoffset = CIRCUMFERENCE;


    const setButtonStates = (state) => {
        if (state === 'initialOrRestart') {
            // after resetting to intial/restart, all buttons should be active except stop, but as we toggled the stop button to start, all should be active
            // always a restart comes after a stop.
            startStopBtn.disabled = false;
            startStopBtn.style.cursor = 'pointer';
            resetBtn.disabled = false;
            resetBtn.style.cursor = 'pointer';
            increaseTimeBtn.disabled = false;
            increaseTimeBtn.style.cursor = 'pointer';
            decreaseTimeBtn.disabled = false;
            decreaseTimeBtn.style.cursor = 'pointer';
            breakBtn.disabled = false;
            breakBtn.style.cursor = 'pointer';
            focusBtn.disabled = false;
            focusBtn.style.cursor = 'pointer';
            setTimeInput.disabled = false;
            setTimeInput.style.cursor = 'text';
        } else if (state === 'running') {
            // after starting, only stopbutton is active remaining all inactive
            startStopBtn.disabled = false;
            startStopBtn.style.cursor = 'pointer';
            resetBtn.disabled = true;
            resetBtn.style.cursor = 'not-allowed';
            increaseTimeBtn.disabled = true;
            increaseTimeBtn.style.cursor = 'not-allowed';
            decreaseTimeBtn.disabled = true;
            decreaseTimeBtn.style.cursor = 'not-allowed';
            breakBtn.disabled = true;
            breakBtn.style.cursor = 'not-allowed';
            focusBtn.disabled = true;
            focusBtn.style.cursor = 'not-allowed';
            setTimeInput.disabled = true;
            setTimeInput.style.cursor = 'not-allowed';
        } else if (state === 'stopped') {
            // after stopping, only startbutton and reset button should be active, rest all inactive
            startStopBtn.disabled = false;
            startStopBtn.style.cursor = 'pointer';
            resetBtn.disabled = false;
            resetBtn.style.cursor = 'pointer';
            increaseTimeBtn.disabled = true;
            increaseTimeBtn.style.cursor = 'not-allowed';
            decreaseTimeBtn.disabled = true;
            decreaseTimeBtn.style.cursor = 'not-allowed';
            breakBtn.disabled = true;
            breakBtn.style.cursor = 'not-allowed';
            focusBtn.disabled = true;
            focusBtn.style.cursor = 'not-allowed';
            setTimeInput.disabled = true;
            setTimeInput.style.cursor = 'not-allowed';
        }
    };


    function updateTimerDisplay(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor(time % 3600 / 60);
        const seconds = time % 60;
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    function toggleStatusButtons(isBreakTime){
        if (isBreakTime) {
            breakBtn.classList.add('active');
            focusBtn.classList.remove('active');
        } else {
            breakBtn.classList.remove('active');
            focusBtn.classList.add('active');
        }
    };

    function updateProgressCircleDisplay(percent){
        const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
        progressCircle.style.strokeDashoffset = offset;
        // progressTime.textContent = `${Math.round(percent)}%`;
    }

    function updateAudioControls(){
        audio.volume = volumeSlider.value / 100;
        const value = (volumeSlider.value - volumeSlider.min) / (volumeSlider.max - volumeSlider.min) * 100;
        if (audio.volume === 0) {
            audio.muted = true;
            volumeOnPath.style.display = 'block';
            volumeOffPath.style.display = 'block';
        } else {
            audio.muted = false;
            volumeOnPath.style.display = 'block';
            volumeOffPath.style.display = 'none';
        }
        volumeSlider.style.setProperty('--value', `${value}%`); 
    }

    // called when DOMContent is Loaded
    function getStatus() {
        // fetch status of all buttons and updates here
        chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
            if (response.status === "getStatusInfo") {
                // console.log("Received Status Info from bg");
                setButtonStates(response.buttonState);
                updateTimerDisplay(response.remainingTime);
                updateProgressCircleDisplay(response.percent);

                // restore the audio and volume controls of the previos state
                chrome.storage.local.get(["currentAudioVolume", "previousAudioVolume"]).then((result) => {
                    let previousAudioVolume = result.previousAudioVolume !== undefined ? result.previousAudioVolume : response.previousAudioVolume; // default value is 95
                    let currentAudioVolume = result.currentAudioVolume !== undefined ? result.currentAudioVolume : response.currentAudioVolume; // default value is 95
                    // console.log("Previous audio volume value is " + previousAudioVolume);
                    // console.log("Current audio volume value is " + currentAudioVolume);
                    volumeSlider.value = currentAudioVolume;
                    updateAudioControls();
                });

                if (response.isTimerRunning) {
                    startStopBtn.textContent = 'Stop';
                } 
                else {
                    startStopBtn.textContent = 'Start';
                    if(response.isCycleComplete){
                        // after each cycle completion, let's toggle the focus and break buttons
                        // console.log( response.isBreakTime ? "Toggled to break time" : "Toggled to focus time" );
                        // console.log("Timer is set for " + response.remainingTime + " seconds");
                    }
                    
                }
                // fetch the previously set value before new window popup
                setTimeInput.value = response.setInputTime;
                // generally on popup window startup, the default focus is on focus buttion, 
                // We need check breaktimes and focustimes, then toggle the activeness accordingly,
                toggleStatusButtons(response.isBreakTime);
                // Retrieve the stored values from chrome.storage.local
                chrome.storage.local.get(['selectedText', 'selectedSrc'], function(result) {
                    if (result.selectedText && result.selectedSrc) {
                        dropdownHeader.innerText = "Notification (" + result.selectedText + ")";
                        audio.src = result.selectedSrc;
                        audio.load();
                    }
                });

                // get the theme
            }
        });
    }

    // switch theme function
    const switchTheme = () => {
        const rootElement = document.documentElement;
        let dataTheme = rootElement.getAttribute('data-theme'),
            newTheme;

        newTheme = (dataTheme === 'light')?'dark':'light';

        // Set the new HTML attribute
        rootElement.setAttribute('data-theme', newTheme);

        // Set the new theme in extension storage API
        chrome.storage.local.set({theme: newTheme}, ()=>{
            // console.log("App Theme changed to:", newTheme);
        });
    }

    // Add Event Listener for the theme switcher
    document.querySelector('#theme-switcher').addEventListener('click', switchTheme);

    const breakBtnFunction = () => {
        setTimeInput.value = 5;
        // toggleStatusButtons(true); // isBreakTime=true and getStatus handles this
        chrome.runtime.sendMessage({ action: "updateBreakTime", breakTime: true}, (response) => {
            // console.log("Received response from bg: " + response.status);
            // console.log("Timer is set for " + response.remainingTime + " seconds");
        });
        getStatus();
    };
    breakBtn.addEventListener("click", breakBtnFunction);

    const focusBtnFunction = () => {
        setTimeInput.value = 25;
        // toggleStatusButtons(false); // isBreakTime=false and getStatus handles this
        chrome.runtime.sendMessage({ action: "updateBreakTime", breakTime: false}, (response) => {
            // console.log("Received response from bg: " + response.status);
            // console.log("Timer is set for " + response.remainingTime + " seconds");
        });
        getStatus();
    };
    focusBtn.addEventListener("click", focusBtnFunction);

    increaseTimeBtn.addEventListener('click', () => {
        // check the time entered in timeinput
        // below line is necessary to check the previously entered time in timeinput
        let value = parseInt(setTimeInput.value.trim()); // in minutes
        if (value === '' || isNaN(value)) {
            value = 0;
        }
        value += 1;
        setTimeInput.value = value;
        let remainingTime =  value;
        chrome.runtime.sendMessage({action: "increaseTime", time: remainingTime}, (response) => {
            if(response.status === "Increased Time"){
                // console.log("Received response from bg:", response.status);
            }
        });
        getStatus(); // update the timer value accordingly
    });

    decreaseTimeBtn.addEventListener('click', () => {
        // check the time entered in timeinput
        // below line is necessary to check the previously entered time in timeinput
        let value = parseInt(setTimeInput.value.trim()); // in minutes
        if (value === 0 || value === '' || isNaN(value)) {
            value = 0;
        }
        else{
            value -= 1;
        }
        setTimeInput.value = value;
        let remainingTime =  value;
        chrome.runtime.sendMessage({action: "decreaseTime", time: remainingTime}, (response) => {
            if(response.status === "Decreased Time"){
                // console.log("Received response from bg:", response.status);
            }
        });
        getStatus(); // update the timer value accordingly
    });

    setTimeInput.addEventListener('input', () => {
        let value = parseInt(setTimeInput.value.trim());
        let remainingTime = 0;
        if (isNaN(value)) {
            remainingTime = 0;
        }
        else{
            remainingTime = value; // Use custom break time
        }
        // For testing in seconds, multiply with 60 in below 3 lines of code
        if(remainingTime > 7*24*60){
            remainingTime = 7*24*60; // maximum time of week in minutes
            setTimeInput.value = 7*24*60;
        }
        chrome.runtime.sendMessage({action: "setInputTime", time: remainingTime}, (response) => {
            if(response.status === "Set Input Time"){
                // console.log("Received response from bg:", response.status);
            }
            getStatus(); // update the timer value accordingly
        });
    });

    startStopBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: startStopBtn.textContent.toLowerCase() }, (response) => {
            if (response.status === "stopped") {
                // console.log("Received response from bg:", "Timer stopped");
            }
            else if(response.status === "started"){
                // console.log("Received response from bg:", "Timer started");
            }
        });
        getStatus();
    });

    resetBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "reset" }, (response) => {
            if (response.status === "reset") {
                // console.log("Received response from bg:", "Timer reset");
                setTimeInput.value = response.isBreakTime ? 5 : 25;
            }
        });
        getStatus();
    });

    muteButton.addEventListener('click', function() {
        // if there are existing audio values in storage, get them
        chrome.storage.local.get(["currentAudioVolume", "previousAudioVolume"]).then((result) => {
            // console.log("Fetched Current and Previous Volume values");
            let previousAudioVolume = result.previousAudioVolume !== undefined ? result.previousAudioVolume : volumeSlider.value; 
            let currentAudioVolume = result.currentAudioVolume !== undefined ? result.currentAudioVolume : volumeSlider.value;

            audio.muted = !audio.muted;
            if (audio.muted) {
                audio.volume = 0;
                volumeSlider.value = 0; // slider also comes to initial position
                previousAudioVolume = currentAudioVolume;
                currentAudioVolume = 0;
            } else {
                currentAudioVolume = previousAudioVolume;
                volumeSlider.value = currentAudioVolume;
            }
    
            chrome.runtime.sendMessage({ action: "updateAudioControls", muted: audio.muted, previousAudioVolume: previousAudioVolume, currentAudioVolume: currentAudioVolume }, (response) => {
                if (response.status === "Updated Audio Controls") {
                    // console.log("Received response from bg:", "Audio Controls Updated Through Mute Button");
                    // console.log("Current audio volume value is " + currentAudioVolume);
                    // console.log("Previous audio volume value is " + previousAudioVolume);
                }
            });
            updateAudioControls();
        });
    });

    volumeSlider.addEventListener('input', function() {
        let previousAudioVolume = volumeSlider.value;
        let currentAudioVolume = volumeSlider.value;
        chrome.storage.local.get(["currentAudioVolume", "previousAudioVolume"]).then((result) => {
            if(parseInt(volumeSlider.value) === 0){
                previousAudioVolume = result.previousAudioVolume !== undefined ? result.previousAudioVolume : previousAudioVolume;
            }
            else{
                previousAudioVolume = volumeSlider.value;
            }
            // due to async nature, below code is executed before local storage fetch
            // place this code inside function code of storage.local.get call
            chrome.runtime.sendMessage({ action: "updateAudioControls", muted: audio.muted, previousAudioVolume: previousAudioVolume, currentAudioVolume: currentAudioVolume }, (response) => {
                if (response.status === "Updated Audio Controls") {
                    // console.log("Received response from bg:", "Audio Controls Updated Through Volume Slider");
                }
            });
            updateAudioControls();
        });
    });

    dropdownHeader.addEventListener('click', () => {
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    dropdownContent.addEventListener('click', (event) => {
        // console.log(event.target);
        if (event.target.classList.contains('dropdown-item')) {
            let selectedValue = event.target.getAttribute('data-value');
            let selectedText = event.target.innerText;
            // console.log(selectedText);
            let selectedSrc = event.target.getAttribute('data-src');
            // console.log(selectedSrc);
            dropdownHeader.innerText = "Notification (" + selectedText + ")";
            audio.src = selectedSrc;
            audio.load();
            // Store the selected text and source in chrome.storage.local
            chrome.storage.local.set({ selectedText: selectedText, selectedSrc: selectedSrc }, function() {
                // console.log("Ringtone Settings saved");
            });
        }
    });

    // Close the dropdown if the user clicks outside of it
    window.addEventListener('click', function(event) {
        if (!event.target.closest('.custom-dropdown') || event.target !== dropdownHeader) {
            dropdownContent.style.display = 'none';
        }
    });


    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        
        if (request.action === "updateTimer") {
            // console.log("Received request from bg:", "Update Timer");
            // getStatus(); 
            // getStatus() can be used but this for activating all elements, not just timer updates, reduces latency
            updateTimerDisplay(request.remainingTime); 
            if (request.isTimerRunning) {
                startStopBtn.textContent = 'Stop';
            } 
            else {
                startStopBtn.textContent = 'Start';
                if(request.isCycleComplete){
                    // after each cycle completion, let's toggle the focus and break buttons
                    // console.log( request.isBreakTime ? "Toggled to break time" : "Toggled to focus time" );
                    // console.log("Timer is set for " + request.remainingTime + " seconds");
                    // set the time input field value 
                    setTimeInput.value = request.isBreakTime ? 5 : 25;
                    toggleStatusButtons(request.isBreakTime);
                    setButtonStates(request.buttonState);
                }
            }
            sendResponse({status: "Timer Updated"});
        }
        else if(request.action === "updateProgressCircle"){
            // console.log("Received request from bg:", "Update Progress Cicle Display");
            if(request.playAudio){
                audio.play();
            }
            updateProgressCircleDisplay(request.percent);
            // handle toggle buttons in updateTimer request
            sendResponse({status: "Progress Circle Display Updated"});
        }

        return true; // it keeps message channel open until sendResponse is sent
    });

    getStatus();
});

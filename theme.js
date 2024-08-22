// console.log("Checking local storage for any preset theme");
// Check local storage for any previously set theme
chrome.storage.local.get(['theme']).then((result)=>{
    let localS = result.theme;
    let themeToSet = localS;
    // if local storage is undefined or null, we check the OS preference
    if (!localS) {
        // console.log("Default system theme is chosen");
        themeToSet = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // console.log("Theme to set:", themeToSet);
    // Set the correct theme
    document.documentElement.setAttribute('data-theme', themeToSet);    
});






// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
"use strict"

const localStorageNamespace="wikiwaver";

const defaultPrefs={
    // main
    "hideMobileWarning":false,
    "theme":"theme-selector-auto",
    "logLimit":"20",
    "logSortDir":"log-sort-newatbottom",
    
    // playback/webaudio-synth
    "webAudioSynthVolume":"50",
    
    // playback/midi
    
    // listener/WikimediaListener
    "wikimediaListenerShowComments":false,
    "wikimediaListenerAcceptedWikis":["enwiki"]
};

// structuredClone is not available on older browsers
const prefs=JSON.parse(JSON.stringify(defaultPrefs));

const hasLocalStorage=!!localStorage;
if(!hasLocalStorage)log("error","localStorage is not available in your browser. Preferences cannot be saved.");

function getLocalStorageKeyName(key){
    return `${localStorageNamespace}:${key}`;
}

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
function getPreference(key){
    if(!hasLocalStorage)return prefs[key]
    let val=localStorage.getItem(getLocalStorageKeyName(key));
    if(val===null)return prefs[key];
    val=JSON.parse(val);
    prefs[key]=val;
    return val;
}

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
function setPreference(key,value){
    prefs[key]=value;
    if(hasLocalStorage)localStorage.setItem(getLocalStorageKeyName(key),JSON.stringify(value));
}

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
function clearSavedPreferences(){
    if(!hasLocalStorage)return;
    const localStorageKeys=Object.keys(localStorage);
    for(const currentKey of localStorageKeys){
        // biome-ignore lint/style/useTemplate: style
        if(!currentKey.startsWith(localStorageNamespace+":"))continue;
        localStorage.removeItem(currentKey);
    }
}
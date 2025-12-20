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
    
    // playback/webaudio-samples
    "webAudioSamplesVolume":"50",
    
    // playback/midi
    
    // listener/WikimediaListener
    "wikimediaListenerShowComments":false,
    "wikimediaListenerAcceptedWikis":["enwiki"]
};

// structuredClone is not available on older browsers
const prefs=JSON.parse(JSON.stringify(defaultPrefs));

let hasLocalStorage=!!localStorage;
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

function clearSavedPreferences(){
    if(!hasLocalStorage)return;
    const localStorageKeys=Object.keys(localStorage);
    for(const currentKey of localStorageKeys){
        // biome-ignore lint/style/useTemplate: style
        if(!currentKey.startsWith(localStorageNamespace+":"))continue;
        localStorage.removeItem(currentKey);
    }
}



// urlsearchparams-only preferences
const searchParams=new URLSearchParams(location.search);
// biome-ignore-start lint/correctness/noUnusedVariables: cross-file reference, intentional
const enableNetworkWarnings=searchParams.get("enableNetworkWarnings")!=="0";
const useSeedRandom=searchParams.get("useSeedrandom")!=="0";
if(hasLocalStorage){
    if(searchParams.get("clearPrefs")==="1")clearSavedPreferences();
    if(searchParams.get("useLocalStorage")==="0")hasLocalStorage=false;
}
const autoListen=searchParams.get("autoListen")!=="0";
// biome-ignore-end lint/correctness/noUnusedVariables: cross-file reference, intentional
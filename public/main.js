// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
// biome-ignore-all lint/complexity/useOptionalChain: compatibility
"use strict"

// prefs
// biome-ignore-start lint/style/useConst: future: editable prefs
let baseNote=48;
// biome-ignore-end lint/style/useConst: future: editable prefs

// ui elements
// biome-ignore-start lint/correctness/noUnusedVariables: cross-file reference, intentional
const mobileWarningDialog=document.getElementById("mobile-warning");
const mobileWarningBgPlaybackMobileSafariNotice=document.getElementById("bgplayback-mobilesafari-notice");
const mobileWarningHideForeverCheckbox=document.getElementById("mobile-warning-hide-forever");
const startStopButton=document.getElementById("start-stop-button");
const themeSelectorContainer=document.getElementById("theme-selector-container");
const playbackModeWebAudioSynthCheckbox=document.getElementById("playbackmode-webaudiosynth");
const webAudioSynthVolumeInput=document.getElementById("webaudiosynth-volume");
const webAudioSynthVolumeText=document.getElementById("webaudiosynth-volume-label");
const playbackModeMidiCheckbox=document.getElementById("playbackmode-midi");
const midiDeviceSelector=document.getElementById("midi-device-selector");
const midiDeviceSelectorContainer=document.getElementById("midi-device-selector-container");
const wikisSelectorShowCommentsCheckbox=document.getElementById("wikis-selector-showcomments");
const wikisSelectorDetails=document.getElementById("wikis-selector-details");
const wikisSelectorContainer=document.getElementById("wikis-selector-container");
const wikisSelectorFilterInput=document.getElementById("wikis-selector-filter");
const wikisSelectorSelectAllCheckbox=document.getElementById("wikis-selector-selectall");
const loggerItemPlacementOptionContainer=document.getElementById("logger-item-placement-option-container");
const visualizerFullscreenButtom=document.getElementById("visualizer-fullscreen-button");
const visualizerDetails=document.getElementById("visualizer-details");
const visualizerContainer=document.getElementById("visualizer-container");
const totalEntriesText=document.getElementById("total-entries");
// biome-ignore-end lint/correctness/noUnusedVariables: cross-file reference, intentional

// general functions
// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
function loadScript(src,sri,crossorigin,referrerpolicy="no-referrer",type){
    if(typeof src!=="string")throw new Error("loadScript: src parameter is invalid or not defined");
    if(sri&&typeof sri!=="string")throw new Error("loadScript: invalid sri parameter");
    if(crossorigin&&typeof crossorigin!=="string")throw new Error("loadScript: invalid crossorigin parameter");
    if(referrerpolicy&&typeof referrerpolicy!=="string")throw new Error("loadScript: invalid referrerpolicy parameter");
    if(type&&typeof type!=="string")throw new Error("loadScript: invalid type parameter");
    const scriptEl=document.createElement("script");
    scriptEl.src=src;
    if(sri)scriptEl.integrity=sri;
    if(crossorigin)scriptEl.crossOrigin=crossorigin;
    if(referrerpolicy)scriptEl.referrerPolicy=referrerpolicy;
    if(type)scriptEl.type=type;
    document.body.appendChild(scriptEl);
    return new Promise((resolve,reject)=>{
        scriptEl.addEventListener("load",()=>{
            resolve(scriptEl);
        });
        scriptEl.addEventListener("error",e=>{
            scriptEl.remove();
            reject(e);
        });
    });
}

// main code
// playback
const notes=[],blackNotesOffset=[1,3,6,8,10];
for(let i=0;i<24;i++){
    notes.push(baseNote+(blackNotesOffset[i%blackNotesOffset.length])+Math.floor(i/blackNotesOffset.length)*12);
}

const swells=[
    [42,46,49],
    [37,44,49,53],
    [32,39,44]
];

const wikimediaListener=new WikimediaListener();

startStopButton.onclick=()=>{
    if((!wikimediaListener.eventSource)||wikimediaListener.eventSource.readyState===EventSource.CLOSED)wikimediaListener.initializeStream();
    else if(wikimediaListener.eventSource.readyState===EventSource.OPEN)wikimediaListener.closeStream();
}

window.addEventListener("offline",()=>{
    log("error","You're offline")
});

window.addEventListener("online",()=>{
    log("info","You're back online")
});

const players=[null,null,null];

// Derived from https://github.com/hatnote/listen-to-wikipedia/blob/ea708fdb4e8e0d1dc1bc593dd29cdd4bdaa21503/static/js/app.js#L248
const scaleFactor=5,maxPitch=100,logUsed=1.0715307808111487;
let totalEntries=0;
function playSound(soundType,data,diffLength){
    let index;
    switch(soundType){
        case "edit":{
            const type=diffLength>0?1:2;
            const absDiffLength=Math.abs(diffLength);
            const size=Math.max(Math.sqrt(absDiffLength)*scaleFactor,3);
            const pitch=100-Math.min(maxPitch, Math.log(size+logUsed)/Math.log(logUsed));
            let fuzz=0;
            if(Math.seedrandom)Math.seedrandom(data.title);
            const x=Math.random(); // x = Math.random() * (width - size) + size;
            const y=Math.random(); // y = Math.random() * (height - size) + size;
            fuzz=Math.floor(Math.random()*4)-2;
            index=Math.max(1,Math.min(Math.floor(pitch/100*notes.length)+fuzz,notes.length-1));
            const note=notes[index]-(diffLength<0?24:0);
            for(const player of players){
                if(!player)continue;
                if(player.constructor.name==="VisualizerPlayback"){
                    player.playNote({x:x,y:y,title:data.title,url:data.notify_url,diffLength:diffLength,isBot:data.bot,isAnonymous:data.isAnonymous},4);
                    continue;
                }
                player.playNote(note,type);
            }
        }
        break;
        case "welcome":{
            const rand=Math.random();
            index=Math.round(rand*(swells.length-1));
            for(const player of players){
                if(!player)continue;
                player.playNote(swells[index],3,8);
            }
        }
        break;
    }
    totalEntries++;
    totalEntriesText.textContent=totalEntries;
}

wikimediaListener.hookOnNewEntry(playSound);

// web audio api synth options
playbackModeWebAudioSynthCheckbox.onchange=()=>{
    if(playbackModeWebAudioSynthCheckbox.checked&&players[0]===null)players[0]=new WebAudioSynthPlayback();
    else if((!playbackModeWebAudioSynthCheckbox.checked)&&players[0]){
        playbackModeWebAudioSynthCheckbox.disabled=true;
        players[0].stop().then(()=>{
            playbackModeWebAudioSynthCheckbox.disabled=false;
            players[0]=null;
            log("info","Web Audio API Synth Playback disabled");
        }).catch(e=>log("error",e));
    }
}

function updateWebAudioSynthVolume(e){
    const currentVolume=webAudioSynthVolumeInput.value;
    if(players[0]){
        players[0].mainGainNode.gain.value=parseInt(currentVolume,10)/100;
    }
    webAudioSynthVolumeText.textContent=currentVolume;
    if(e)setPreference("webAudioSynthVolume",currentVolume);
}

webAudioSynthVolumeInput.oninput=updateWebAudioSynthVolume;

const savedWebAudioSynthVolume=getPreference("webAudioSynthVolume");
webAudioSynthVolumeInput.value=savedWebAudioSynthVolume;
updateWebAudioSynthVolume();

// for mobile devices
addEventListener("touchend",()=>{
    if(players[0]&&players[0].actx.state!=="running")players[0].actx.resume();
});

// midi playback option
playbackModeMidiCheckbox.onchange=()=>{
    if(playbackModeMidiCheckbox.checked&&players[1]===null)players[1]=new MidiPlayback();
    else if((!playbackModeMidiCheckbox.checked)&&players[1]){
        playbackModeMidiCheckbox.disabled=true;
        players[1].stop().then(()=>{
            playbackModeMidiCheckbox.disabled=false;
            midiDeviceSelectorContainer.open=false;
            players[1]=null;
            log("info","MIDI Playback disabled");
        }).catch(e=>log("error",e));
    }
}

// visualizer option
visualizerDetails.ontoggle=e=>{
    if(e.newState==="open"){
        players[2]=new VisualizerPlayback();
    }else{
        players[2].stop().then(()=>{
            players[2]=null;
        }).catch(e=>log("error",e));
    }
}

// theme selector
let themeStyleSheet,themeStyleSheetEl;
try{
    themeStyleSheet=new CSSStyleSheet();
    document.adoptedStyleSheets.push(themeStyleSheet);
}catch(e){
    log("info",`Cannot use document.adoptedStyleSheets with error: ${e}`);
    log("info","Falling back using style tag.");
    themeStyleSheetEl=document.createElement("style");
    document.head.appendChild(themeStyleSheetEl);
    themeStyleSheet=themeStyleSheetEl.sheet;
}

function changeTheme(id,writePrefs=false){
    let rule="";
    switch(id){
        case "theme-selector-auto":
        rule="";
        break;
        case "theme-selector-light":
        rule=document.styleSheets[0].cssRules[1].cssText;
        break;
        case "theme-selector-dark":
        rule=document.styleSheets[0].cssRules[2].cssText.replace("(prefers-color-scheme: dark)","all");
        break;
    }
    try{
        themeStyleSheet.replaceSync(rule);
    }catch{
        themeStyleSheetEl.textContent=rule;
    }
    if(writePrefs)setPreference("theme",id);
}

themeSelectorContainer.addEventListener("change",e=>{
    const target=e.target;
    if(!(target&&target.id.startsWith("theme-selector-")))return;
    changeTheme(target.id,true);
});

const savedTheme=getPreference("theme");
document.getElementById(savedTheme).checked=true;
changeTheme(savedTheme);

// wiki show comment option
wikisSelectorShowCommentsCheckbox.onchange=()=>{
    if(wikisSelectorShowCommentsCheckbox.checked)wikimediaListener.showComments=true;
    else wikimediaListener.showComments=false;
    setPreference("wikimediaListenerShowComments",wikimediaListener.showComments);
}
wikisSelectorShowCommentsCheckbox.checked=getPreference("wikimediaListenerShowComments");

// wikis selector
let isWikisListLoading=false;
async function onWikisSelectorDetailsToggled(){
    if(isWikisListLoading)return;
    if(!wikisSelectorDetails.open)return;
    if(document.getElementById("wikis-selector-is-loading")===null)return;
    isWikisListLoading=true;
    const wikisResponse=await fetch("listener/wikis.json");
    const wikis=await wikisResponse.json();
    isWikisListLoading=false;
    wikis.sort((a,b)=>a.n>b.n);
    wikisSelectorContainer.innerHTML="";
    let tmpDiv,tmpEl,wikiName;
    for(const wiki of wikis){
        wikiName=`${wiki.n} (${wiki.w})`;
        
        tmpDiv=document.createElement("div");
        tmpDiv.classList.add("wikis-selector-div");
        tmpDiv.dataset.wikiName=wikiName;
        
        tmpEl=document.createElement("input");
        tmpEl.autocomplete="off";
        tmpEl.type="checkbox";
        tmpEl.id=wiki.w;
        tmpEl.classList.add("wikis-selector");
        tmpEl.checked=wikimediaListener.acceptedWikis.indexOf(wiki.w)!==-1;
        tmpEl.dataset.wikiName=wikiName;
        tmpDiv.appendChild(tmpEl);
        
        tmpEl=document.createElement("label");
        tmpEl.htmlFor=wiki.w;
        tmpEl.textContent=wikiName;
        tmpDiv.appendChild(tmpEl);
        
        wikisSelectorContainer.appendChild(tmpDiv);
    }
}

wikisSelectorDetails.ontoggle=()=>{
    onWikisSelectorDetailsToggled();
};

wikisSelectorContainer.addEventListener("change",e=>{
    const target=e.target;
    if(!(target&&target.classList.contains("wikis-selector")))return;
    if(target.checked&&wikimediaListener.acceptedWikis.indexOf(target.id)===-1){
        wikimediaListener.acceptedWikis.push(target.id);
        log("info",`${target.dataset.wikiName} (${target.id}) is now enabled for listening`);
    }else if(!target.checked){
        const wikiIndex=wikimediaListener.acceptedWikis.indexOf(target.id);
        if(wikiIndex===-1)return;
        wikimediaListener.acceptedWikis.splice(wikiIndex,1);
        log("info",`${target.dataset.wikiName} (${target.id}) is now disabled for listening`);
    }
    setPreference("wikimediaListenerAcceptedWikis",wikimediaListener.acceptedWikis);
});

wikisSelectorSelectAllCheckbox.onchange=()=>{
    wikimediaListener.acceptedWikis=[];
    if(wikisSelectorSelectAllCheckbox.checked){
        document.querySelectorAll(".wikis-selector").forEach(e=>{
            e.checked=true;
            wikimediaListener.acceptedWikis.push(e.id);
        });
        log("info",`All wikis have been enabled for listening`);
    }else{
        document.querySelectorAll(".wikis-selector").forEach(e=>{
            e.checked=false;
        });
        log("info",`All wikis have been disabled for listening`);
    }
    setPreference("wikimediaListenerAcceptedWikis",wikimediaListener.acceptedWikis);
}

let wikisSelectorFilterSheet,wikisSelectorFilterSheetEl;
try{
    wikisSelectorFilterSheet=new CSSStyleSheet();
    document.adoptedStyleSheets.push(wikisSelectorFilterSheet);
}catch(e){
    log("info",`Cannot use document.adoptedStyleSheets with error: ${e}`);
    log("info","Falling back using style tag.");
    wikisSelectorFilterSheetEl=document.createElement("style");
    document.head.appendChild(wikisSelectorFilterSheetEl);
    wikisSelectorFilterSheet=wikisSelectorFilterSheetEl.sheet;
}

let wikisSelectorFilterSheetCleared=true,wikisSelectorFilterSheetRuleIndex;
wikisSelectorFilterInput.oninput=()=>{
    if(wikisSelectorFilterInput.value===""){
        try{
            wikisSelectorFilterSheet.replaceSync("");
        }catch{
            wikisSelectorFilterSheetEl.textContent="";
        }
        wikisSelectorFilterSheetCleared=true;
        return;
    }
    if(wikisSelectorFilterSheetCleared){
        wikisSelectorFilterSheet.insertRule("div.wikis-selector-div { display: none; }");
        wikisSelectorFilterSheetRuleIndex=wikisSelectorFilterSheet.insertRule(`div.wikis-selector-div#unselected { display: block; }`);
        wikisSelectorFilterSheetCleared=false;
    }
    wikisSelectorFilterSheet.cssRules[wikisSelectorFilterSheetRuleIndex].selectorText=`div.wikis-selector-div[data-wiki-name*="${CSS.escape(wikisSelectorFilterInput.value)}"i]`
}

// logger options
loggerItemPlacementOptionContainer.addEventListener("change",e=>{
    const target=e.target;
    if(!(target&&target.classList.contains("log-sort-dir-option")))return;
    setPreference("logSortDir",target.id);
});
document.getElementById(getPreference("logSortDir")).checked=true;

// visualizer fullscreen button
visualizerFullscreenButtom.onclick=()=>{
    if(!visualizerContainer.requestFullscreen){
        log("error","Fullscreen API is not supported");
        return;
    }
    if(document.fullscreenElement){
        document.exitFullscreen();
        return;
    }
    visualizerContainer.requestFullscreen().catch(e=>{
        log("error",`Unable to enter fullscreen: ${e}`);
    });
}

visualizerContainer.onfullscreenchange=()=>{
    visualizerFullscreenButtom.textContent=document.fullscreenElement?"Exit fullscreen":"Fullscreen";
}

// mobile user warning
if(navigator.maxTouchPoints&&(!getPreference("hideMobileWarning"))){
    mobileWarningDialog.addEventListener("close",()=>{
        if(mobileWarningHideForeverCheckbox.checked)setPreference("hideMobileWarning",true)
        wikimediaListener.initializeStream();
    });
    if(/iOS|Macintosh|iP(hone|ad|od)/.test(navigator.userAgent)){
        mobileWarningBgPlaybackMobileSafariNotice.classList.remove("hidden");
    }
    mobileWarningDialog.showModal();
}else wikimediaListener.initializeStream();

// mark script as loaded successfully
scriptSuccessfullyLoaded=true;
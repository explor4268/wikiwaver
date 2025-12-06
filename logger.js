// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
"use strict"

// prefs
let logLimit=getPreference("logLimit");

// ui elements
const logsDiv=document.getElementById("logs");
const logMaxItemsInput=document.getElementById("log-max-items");
const logMaxItemsText=document.getElementById("log-max-items-label");

// main code
function clearLogOverflow(){
    while(logsDiv.childElementCount>logLimit){
        logsDiv.removeChild(logsDiv.firstChild);
    }
}

let entry;
function log(type="no type",object="<no message>",entryParser){
    if(type==="entry"&&typeof entryParser!=="function"){
        type="error";
        object=`Error: log type is ${type}, but entryParser is not a function`;
    }
    clearLogOverflow();
    entry=document.createElement("div");
    entry.classList.add("log");
    switch(type){
        case "info":
        entry.classList.add("log-info");
        entry.textContent=object;
        break;
        case "error":
        entry.classList.add("log-error");
        entry.textContent=object;
        break;
        case "entry":
        entry.classList.add("log-entry");
        entryParser(entry,object);
        break;
        default:
        entry.classList.add("log-info");
        entry.textContent=`[unknown log type: ${type}]: ${object}`;
        break;
    }
    logsDiv.appendChild(entry);
}

function updateLogMaxItems(currentLogLimit,writePrefs=false){
    logLimit=parseInt(currentLogLimit,10);
    clearLogOverflow();
    logMaxItemsText.textContent=currentLogLimit;
    if(writePrefs)setPreference("logLimit",currentLogLimit);
}

logMaxItemsInput.oninput=()=>{
    updateLogMaxItems(logMaxItemsInput.value,true);
}

logMaxItemsInput.value=logLimit;
updateLogMaxItems(logLimit.toString());

window.onerror=(message,source,lineno,colno)=>{
    log("error",`An error occurred: Message: ${message}. Source: ${source} at line ${lineno} column ${colno}`);
}
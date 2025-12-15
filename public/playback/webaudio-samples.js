// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
"use strict"

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
class WebAudioSamplesPlayback{
    async loadSample(targetMap,instrument,note){
        const abuff=await fetch(`playback/webaudio-samples/${instrument}/${note}.ogg`).then(r=>r.arrayBuffer()).then(ab=>this.actx.decodeAudioData(ab));
        targetMap.set(note,abuff);
        this.loadedElements++;
        webAudioSamplesLoadingProgressBar.value=this.loadedElements;
        webAudioSamplesLoadingProgressBarTooltip.textContent=Math.floor(this.loadedElements/this.totalElementsToLoad*100);
    }
    async initialize(){
        let promises;
        // celesta
        promises=[];
        for(const note of notes){
            this.totalElementsToLoad++;
            promises.push(this.loadSample(this.instr[0],"celesta",note));
        }
        // clavi
        promises=[];
        for(const note of notes){
            this.totalElementsToLoad++;
            promises.push(this.loadSample(this.instr[1],"clavi",note+claviOffset));
        }
        // swells
        promises=[];
        for(const swell of swells){
            this.totalElementsToLoad++;
            promises.push(this.loadSample(this.instr[2],"swells",swell.join(",")));
        }
        
        webAudioSamplesLoadingProgressBar.max=this.totalElementsToLoad;
        webAudioSamplesLoadingProgressBar.value=0;
        
        await Promise.all(promises);
        promises=null;
        
        this.loaded=true;
        webAudioSamplesLoadingProgressBarContainer.classList.add("hidden");
        log("info","Web Audio API (Samples) Playback initialized");
    }
    playNote(note,type=1,_ignored){
        if(type===4)return;
        if(this.actx.state!=="running")return;
        if(Array.isArray(note)){
            note=note.join(",");
        }
        const buffer=this.instr[type-1].get(note);
        if(!buffer)return;
        const sampleSource=new AudioBufferSourceNode(this.actx,{buffer:buffer});
        sampleSource.connect(this.mainGainNode);
        sampleSource.start();
    }
    stop(){
        log("info","Closing Web Audio API (Samples) Playback");
        this.loaded=false;
        for(const instr of this.instr){
            instr.clear();
        }
        return this.actx.close();
    }
    constructor(){
        log("info","Initializing Web Audio API (Samples) Playback");
        this.actx=new AudioContext();
        this.mainGainNode=this.actx.createGain();
        this.mainGainNode.connect(this.actx.destination);
        this.mainGainNode.gain.value=parseInt(getPreference("webAudioSamplesVolume"),10)/100;
        this.instr=[new Map(),new Map(),new Map()];
        this.loaded=false;
        this.totalElementsToLoad=0;
        this.loadedElements=0;
        this.initialize();
    }
}
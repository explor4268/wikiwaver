// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
"use strict"

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
class MidiPlayback{
    isMIDIDeviceChanged(){
        return this.selectedMidiDevice!==null&&(this.selectedMidiOutput?.connection==="closed"||(WebMidi.outputs?.[this.selectedMidiDevice]?.id!==this.selectedMidiOutput.id));
    }
    stopOngoingPlayback(){
        if(!(this.selectedMidiDevice&&this.selectedMidiOutput?.channels))return;
        for(let i=1;i<this.notePlaybacks.length;i++){
            for(let j=0;j<this.notePlaybacks[i].length;j++){
                if(this.notePlaybacks[i][j]!==null){
                    this.selectedMidiOutput.channels[i].playNote(j,this.noteOptionsStop);
                    clearTimeout(this.notePlaybacks[i][j]);
                    this.notePlaybacks[i][j]=null;
                }
            }
        }
    }
    updateMIDIDevices(updatePrompt){
        if(updatePrompt)log("info","A new MIDI device has been plugged or unplugged")
        if(this.isMIDIDeviceChanged()){
            midiDeviceSelector.value="none";
            this.stopOngoingPlayback();
            this.selectedMidiDevice=null;
            this.selectedMidiOutput=null;
            log("info","Current MIDI device is no longer available, please select it again from the device selection list when the device becomes available again.");
        }
        midiDeviceSelector.textContent="";
        let deviceOptionEl=document.createElement("option");
        deviceOptionEl.textContent=`--- Select MIDI Output Device ---`;
        deviceOptionEl.value="none";
        midiDeviceSelector.appendChild(deviceOptionEl);
        WebMidi.outputs.forEach((device,index)=>{
            deviceOptionEl=document.createElement("option");
            deviceOptionEl.textContent=`MIDI device ${index}: ${device.name}`;
            deviceOptionEl.value=index;
            midiDeviceSelector.appendChild(deviceOptionEl);
        });
    }
    async initializeWebMidiLib(){
        if(!globalThis.WebMidi){
            log("info","Loading WEBMIDI.js library...");
            try{
                await loadScript("https://cdn.jsdelivr.net/npm/webmidi@3.1.14/dist/iife/webmidi.iife.min.js","sha256-O7EEMiS+a/K81hl1HyIhl2jXsimqTPH5OvsHz5ujg9Y=","anonymous","no-referrer");
                if(!globalThis.WebMidi){
                    log("error","WebMidi is not defined");
                    throw new Error("WebMidi is not defined");
                }
            }catch(e){
                log("error",`Error when loading WEBMIDI.js library: ${e}`);
                playbackModeMidiCheckbox.indeterminate=true;
                playbackModeMidiCheckbox.disabled=false;
                throw e;
            }
        }
        try{
            await WebMidi.enable();
            this.midiInitialized=true;
            if(WebMidi.outputs.length<1){
                log("error","No MIDI device detected");
            }
            log("info","MIDI Enabled");
            this.updateMIDIDevices();
            WebMidi.addListener("portschanged",()=>this.updateMIDIDevices(true));
            playbackModeMidiCheckbox.disabled=false;
            midiDeviceSelectorContainer.open=true;
            
            midiDeviceSelector.onchange=()=>{
                if(!this.midiInitialized)return;
                if(midiDeviceSelector.value==="none"){
                    this.stopOngoingPlayback();
                    this.selectedMidiDevice=null;
                    this.selectedMidiOutput=null;
                    log("info","MIDI device unselected")
                }else{
                    this.stopOngoingPlayback();
                    this.selectedMidiDevice=midiDeviceSelector.value;
                    this.selectedMidiOutput=WebMidi.outputs[this.selectedMidiDevice];
                    this.selectedMidiOutput.channels[1].sendProgramChange(this.channel1Instrument);
                    this.selectedMidiOutput.channels[2].sendProgramChange(this.channel2Instrument);
                    this.selectedMidiOutput.channels[3].sendProgramChange(this.channel3Instrument);
                    log("info",`MIDI device "${this.selectedMidiOutput.name}" (index ${this.selectedMidiDevice}) has been selected`)
                }
            }
        }catch(e){
            log("error",`Error when enabling MIDI: ${e}`);
            playbackModeMidiCheckbox.indeterminate=true;
            playbackModeMidiCheckbox.disabled=false;
            throw e;
        }
    }
    playNote(note,type=1,noteDurationS=null){
        if(type===4)return;
        if(noteDurationS===null)noteDurationS=this.noteDurationS;
        if(Array.isArray(note)){
            for(const n of note){
                this.playNote(n,type,noteDurationS);
            }
            return;
        }
        if(this.selectedMidiDevice&&this.selectedMidiOutput?.channels?.[type]){
            if(this.notePlaybacks[type][note]!==null){
                clearTimeout(this.notePlaybacks[type][note]);
                this.notePlaybacks[type][note]=null;
            }
            this.selectedMidiOutput.channels[type].playNote(note,this.noteOptions);
            this.notePlaybacks[type][note]=setTimeout(()=>{
                if(!(this.selectedMidiDevice&&this.selectedMidiOutput?.channels?.[type]))return;
                this.selectedMidiOutput.channels[type].playNote(note,this.noteOptionsStop);
                this.notePlaybacks[type][note]=null;
            },noteDurationS*1000);
        }
    }
    stop(){
        log("info","Closing MIDI Playback");
        this.stopOngoingPlayback();
        return WebMidi.disable();
    }
    constructor(){
        this.noteOptions={
            attack:1
        };
        this.noteOptionsStop=structuredClone(this.noteOptions);
        this.noteOptionsStop.attack=0;
        this.noteDurationS=4;
        this.channel1Instrument=8; // Celesta
        this.channel2Instrument=7; // Clavi
        this.channel3Instrument=89; // Pad 2 (Warm)
        
        this.notePlaybacks=[null];
        for(let i=0;i<3;i++){
            this.notePlaybacks.push(new Array(128).fill(null));
        }
        this.midiInitialized=false;
        this.selectedMidiDevice=null;
        this.selectedMidiOutput=null;
        playbackModeMidiCheckbox.disabled=true;
        log("info","Initializing MIDI. Press Allow to give MIDI access to this app.");
        this.initializeWebMidiLib();
    }
}
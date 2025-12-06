// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
// biome-ignore-all lint/style/useExponentiationOperator: style
"use strict";

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
class WebAudioSynthPlayback{
    constructor(){
        this.perNoteGain=0.25;
        this.minPerNoteExpGain=0.001;
        
        this.actx=new AudioContext();
        this.oscillators=[];
        this.mainGainNode=this.actx.createGain();
        this.mainGainNode.connect(this.actx.destination);
        this.mainGainNode.gain.value=parseInt(getPreference("webAudioSynthVolume"),10)/100;
        this.instr1cosineTerms=new Float32Array([0,1,0,0,0.25]);
        this.instr1sineTerms=new Float32Array(this.instr1cosineTerms.length);
        this.instr1waveform=this.actx.createPeriodicWave(this.instr1sineTerms,this.instr1cosineTerms);
        this.instr2type="sawtooth";
        this.instr3type="square";
        this.noteDurationS=2;
        
        this.noteToFreqTable=[];
        for(let i=0;i<127;i++){
            this.noteToFreqTable.push(440*Math.pow(2,(i-69)/12));
        }
        log("info","Web Audio API Synth Playback initialized");
    }
    playNote(note,type=1,noteDurationS=null){
        if(type===4)return;
        if(this.actx.state!=="running")return;
        if(noteDurationS===null)noteDurationS=this.noteDurationS;
        if(Array.isArray(note)){
            for(const n of note){
                this.playNote(n,type,noteDurationS);
            }
            return;
        }
        const osc=this.actx.createOscillator();
        const oscGain=this.actx.createGain();
        if(type!==3)oscGain.gain.value=this.perNoteGain;
        else oscGain.gain.value=this.minPerNoteExpGain;
        switch(type){
            case 1:
            osc.setPeriodicWave(this.instr1waveform);
            break;
            case 2:
            osc.type=this.instr2type;
            break;
            case 3:
            osc.type=this.instr3type;
            break;
            default:
            break;
        }
        osc.frequency.value=this.noteToFreqTable[note];
        osc.connect(oscGain);
        oscGain.connect(this.mainGainNode);
        osc.start();
        const peakTime=this.actx.currentTime+noteDurationS*0.2;
        const endTime=this.actx.currentTime+noteDurationS;
        oscGain.gain.exponentialRampToValueAtTime(this.minPerNoteExpGain,endTime);
        if(type===3)oscGain.gain.exponentialRampToValueAtTime(this.perNoteGain,peakTime);
        osc.stop(endTime);
        osc.onended=()=>{
            osc.disconnect();
            oscGain.disconnect();
            oscGain.gain.cancelScheduledValues(this.actx.currentTime);
        };
    }
    stop(){
        log("info","Closing Web Audio API Synth Playback");
        return this.actx.close();
    }
}
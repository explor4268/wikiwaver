// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
"use strict";

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
class VisualizerPlayback{
    constructor(){
        this.scaleFactor=5;
        this.maxCircleAnimationTimeoutMs=25000; // for gc if animationend event is not triggered
        this.setIntervalID=setInterval(()=>{
            const datenow=Date.now();
            document.querySelectorAll(".visualizer-circle-container").forEach(e=>{
                if(datenow-parseInt(e.dataset.created,10)>this.maxCircleAnimationTimeoutMs)e.remove();
            });
        },5000);
    }
    playNote(note,type=1){
        if(type!==4)return;
        if(typeof note!=="object")return;
        const circleContainer=document.createElement("a");
        circleContainer.dataset.created=Date.now().toString();
        circleContainer.target="_blank";
        circleContainer.href=note.url;
        circleContainer.classList.add("visualizer-circle-container");
        circleContainer.style.left=`${note.x*100}%`;
        circleContainer.style.top=`${note.y*100}%`;
        
        let tmpEl=document.createElement("div");
        tmpEl.classList.add("visualizer-circle");
        circleContainer.appendChild(tmpEl);
        const size=`calc(${Math.max(this.scaleFactor*Math.sqrt(Math.abs(note.diffLength)),3)}px + var(--visualizer-circle-initial-size-increase))`;
        tmpEl.style.width=size;
        tmpEl.style.height=size;
        if(note.isBot)tmpEl.style.backgroundColor="var(--visualizer-circle-bg-usertype-bot)";
        else if(note.isAnonymous)tmpEl.style.backgroundColor="var(--visualizer-circle-bg-usertype-anonymous)";
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=note.title;
        tmpEl.classList.add("visualizer-circle-tooltip");
        circleContainer.appendChild(tmpEl);
        
        circleContainer.onanimationend=()=>{
            circleContainer.remove();
        }
        visualizerContainer.appendChild(circleContainer);
    }
    stop(){
        return new Promise((resolve,reject)=>{try{
            clearTimeout(this.setIntervalID);
            document.querySelectorAll(".visualizer-circle-container").forEach(e=>{e.remove()});
            resolve();
        }catch(e){
            reject(e);
        }});
    }
}
// biome-ignore-all lint/suspicious/noRedundantUseStrict: not a module
// biome-ignore-all lint/style/useTemplate: style, nested string literals not preferred
"use strict"

// biome-ignore lint/correctness/noUnusedVariables: cross-file reference, intentional
class WikimediaListener{
    constructor(){
        this.showComments=getPreference("wikimediaListenerShowComments");
        this.eventSourceURL="https://stream.wikimedia.org/v2/stream/recentchange";
        this.acceptedWikis=getPreference("wikimediaListenerAcceptedWikis");
        this.acceptedNamespaces=[
            0 // Main
        ];
        this.acceptedTypes=[
            "new",
            "edit"
        ];
        // Temporary accounts name format: https://en.wikipedia.org/wiki/Wikipedia:Temporary_accounts#:~:text=This%20account%27s%20name%20follows%20the%20pattern
        // RegExp for matching IPv4 addresses: https://stackoverflow.com/a/36760050 (CC BY-SA 4.0)
        // IPv6 regexp won't be implemented, as most wikis are now using the new temporary account system and naming scheme.
        // However, some wikis like ruwiki still used IPs (mostly IPv4) to identify anonymous edits
        this.anonymousAccountRegExp=/^~[0-9]{4,6}(-[0-9]{1,5})+$|^(((?!25?[6-9])[12]\d|[1-9])?\d\.?\b){4}$/;
        this.revertedChangeRegExp=/^(Undid |Revert|Restored revision )/i;
        
        this.eventSource=null;
        this.onNewEntryHooks=[];
    }
    closeStream(){
        this.eventSource.close();
        log("info","Connection closed");
        startStopButton.textContent="Resume Listening";
        this.eventSource=null;
    }
    onConnect(){
        log("info","Opened connection");
        startStopButton.disabled=false;
        startStopButton.textContent="Pause Listening";
    }
    onEventSourceError(){
        log("error",`Unable to connect to ${this.eventSourceURL}`);
        if(!navigator.onLine)log("error","No internet connection");
        startStopButton.disabled=false;
        startStopButton.textContent="Retry";
    }
    logEntry(entry,object){
        let tmpEl,tc;
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=object.serverUrl;
        tmpEl.textContent=object.place;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=`: user `;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=`${object.serverUrl}/wiki/User:${object.user}`;
        tmpEl.textContent=object.user;
        entry.appendChild(tmpEl);
        
        if(object.bot){
            tmpEl=document.createElement("span");
            tmpEl.textContent=` (bot)`;
            tmpEl.classList.add("usertype-bot");
            entry.appendChild(tmpEl);
        }
        if(object.isAnonymous){
            tmpEl=document.createElement("span");
            tmpEl.textContent=` (anonymous)`;
            tmpEl.classList.add("usertype-anonymous");
            entry.appendChild(tmpEl);
        }
        
        tmpEl=document.createElement("span");
        switch(object.type){ // avoid passing this (self) to argument
            case "edit": // using this approach instead of this.contribType as mapping object
            if(object.isRevert){
                tmpEl.textContent=` has reverted some edit(s) on `;
                tmpEl.classList.add("edittype-undo");
            }else tmpEl.textContent=` has edited the `;
            break;
            case "new":
            tmpEl.textContent=` has created the `;
            tmpEl.classList.add("difflength-positive");
            break;
        }
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=object.notifyUrl;
        tmpEl.textContent=object.title;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=` page, `;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=` ${object.diffLength>0?"+":""}${object.diffLength}`
        if(object.diffLength>0)tmpEl.classList.add("difflength-positive");
        else if(object.diffLength<0)tmpEl.classList.add("difflength-negative");
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tc=` byte`;
        if(Math.abs(object.diffLength)!==1)tc+='s';
        tc+='.'
        
        if(object.showComments&&object.parsedComment)tc+=` Comment: ${object.parsedComment.replaceAll('href="/','target="_blank" href="'+object.serverUrl+'/')}`;
        tmpEl.innerHTML=tc;
        entry.appendChild(tmpEl);
    }
    hookOnNewEntry(callback){
        if(typeof callback!=="function"){
            log("error","hookOnNewEntry: callback is not a function");
            throw new Error("hookOnNewEntry: callback is not a function");
        }
        this.onNewEntryHooks.push(callback);
    }
    handleRecentChange(data){
        if(this.acceptedNamespaces.length!==0&&this.acceptedNamespaces.indexOf(data.namespace)===-1)return;
        let oldLength,newLength,diffLength;
        oldLength=data.length.old;
        if(!oldLength)oldLength=0;
        newLength=data.length.new;
        if(!newLength)newLength=0;
        diffLength=newLength-oldLength;
        data.isAnonymous=this.anonymousAccountRegExp.test(data.user);
        data.isRevert=this.revertedChangeRegExp.test(data.comment);
        log("entry",{
            place:data.wiki,
            type:data.type,
            user:data.user,
            bot:data.bot,
            serverUrl:data.server_url,
            title:data.title,
            titleUrl:data.title_url,
            oldId:data.revision.old,
            newId:data.revision.new,
            notifyUrl:data.notify_url,
            diffLength:diffLength,
            comment:data.comment,
            parsedComment:data.parsedcomment,
            showComments:this.showComments,
            isAnonymous:data.isAnonymous,
            isRevert:data.isRevert
        },this.logEntry);
        
        for(const callback of this.onNewEntryHooks){
            callback("edit",data,diffLength);
        }
    }
    logNewUser(entry,object){
        let tmpEl;
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=`User `;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=object.titleUrl;
        tmpEl.textContent=object.user;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=` has joined Wikipedia!`;
        tmpEl.classList.add("difflength-positive");
        entry.appendChild(tmpEl);
    }
    logPageDeletion(entry,object){
        let tmpEl,tc;
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=object.serverUrl;
        tmpEl.textContent=object.place;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("span");
        tmpEl.textContent=`: user `;
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=`${object.serverUrl}/wiki/User:${object.user}`;
        tmpEl.textContent=object.user;
        entry.appendChild(tmpEl);
        
        if(object.bot){
            tmpEl=document.createElement("span");
            tmpEl.textContent=` (bot)`;
            tmpEl.classList.add("usertype-bot");
            entry.appendChild(tmpEl);
        }
        if(object.anonymousAccountRegExp.test(object.user)){
            tmpEl=document.createElement("span");
            tmpEl.textContent=` (anonymous)`;
            tmpEl.classList.add("usertype-anonymous");
            entry.appendChild(tmpEl);
        }
        
        tmpEl=document.createElement("span");
        if(object.logType==="delete"){
            tmpEl.textContent=` has deleted the `;
            tmpEl.classList.add("difflength-negative");
        }else if(object.logType==="move"){
            tmpEl.textContent=` has moved the `;
            tmpEl.classList.add("edittype-move");
        }
        entry.appendChild(tmpEl);
        
        tmpEl=document.createElement("a");
        tmpEl.target="_blank";
        tmpEl.href=object.titleUrl;
        tmpEl.textContent=object.title;
        entry.appendChild(tmpEl);
        
        if(object.logType==="move"){
            tmpEl=document.createElement("span");
            tmpEl.textContent=` page to `
            entry.appendChild(tmpEl);
            
            tmpEl=document.createElement("a");
            tmpEl.target="_blank";
            tmpEl.href=`${object.serverUrl}/wiki/${object.logParams.target}`;
            tmpEl.textContent=object.logParams.target;
            entry.appendChild(tmpEl);
        }
        
        tmpEl=document.createElement("span");
        tc=` page.`;
        
        if(object.showComments&&object.parsedComment)tc+=` Comment: ${object.parsedComment.replaceAll('href="/','target="_blank" href="'+object.serverUrl+'/')}`;
        tmpEl.innerHTML=tc;
        entry.appendChild(tmpEl);
    }
    handleRecentLog(data){
        switch(data.log_type){
            case "delete":
            case "move":
            if(this.acceptedNamespaces.length!==0&&this.acceptedNamespaces.indexOf(data.namespace)===-1)return;
            log("entry",{
                place:data.wiki,
                serverUrl:data.server_url,
                title:data.title,
                titleUrl:data.title_url,
                comment:data.comment,
                parsedComment:data.parsedcomment,
                showComments:this.showComments,
                user:data.user,
                bot:data.bot,
                logType:data.log_type,
                logParams:data.log_params,
                anonymousAccountRegExp:this.anonymousAccountRegExp
            },this.logPageDeletion);
            break;
            case "newusers":
            log("entry",{
                user:data.user,
                titleUrl:data.title_url
            },this.logNewUser);
            
            for(const callback of this.onNewEntryHooks){
                callback("welcome",data,0);
            }
            break;
        }
    }
    onMessage(e){
        const data=JSON.parse(e.data);
        if(data.meta.domain==="canary")return;
        if(data.meta.stream==="mediawiki.recentchange"){
            if(this.acceptedWikis.indexOf(data.wiki)!==-1&&this.acceptedTypes.indexOf(data.type)!==-1)return this.handleRecentChange(data);
            else if(data.type==="log"&&(data.log_type==="newusers"||this.acceptedWikis.indexOf(data.wiki)!==-1))return this.handleRecentLog(data);
        }
        switch(data.meta.stream){
            case "mediawiki.recentchange":
            break;
        }
    }
    initializeStream(){
        this.eventSource=new EventSource(this.eventSourceURL);
        this.eventSource.onopen=e=>this.onConnect(e);
        this.eventSource.onmessage=e=>this.onMessage(e);
        this.eventSource.onerror=e=>this.onEventSourceError(e);
        startStopButton.textContent="Connecting";
        startStopButton.disabled=true;
        log("info","Connecting, please wait");
    }
}
var Timebase=function(WX){function tick2mbt(tick){return{beat:~~(tick/TICKS_PER_BEAT),tick:tick%TICKS_PER_BEAT}}function mbt2tick(mbt){return mbt.beat*TICKS_PER_BEAT+mbt.tick}function Note(){this.pitch=60,this.velo=64,this.start=0,this.end=120,this.next=null}function NoteList(){this.empty()}function Transport(BPM){this.BPM=BPM,this.oldBPM=BPM,this.absOrigin=0,this.absOldNow=0,this.now=0,this.loopStart=0,this.loopEnd=0,this.lookahead=0,this.BIS=0,this.TIS=0,this.playbackQ=[],this.notelists=[],this.views=[],this.RUNNING=!1,this.LOOP=!1,this.USE_METRONOME=!1,this.setBPM(BPM),this._loop()}var TICKS_PER_BEAT=480;return Note.prototype={get:function(){return{pitch:this.pitch,velo:this.velo,start:this.start,end:this.end}},getDuration:function(){return this.end-this.start},movePitch:function(delta){this.pitch+=delta,this.pitch=WX.clamp(this.pitch,0,127)},moveTime:function(delta){var dur=this.end-this.start;this.moveStart(delta),this.end=this.start+dur},moveStart:function(delta){this.start+=delta,this.start=WX.clamp(this.start,0,this.end-1)},moveEnd:function(delta){this.end+=delta,this.end=Math.max(this.end,this.start+1)},set:function(){WX.isObject(arguments[0])?(this.pitch=arguments[0].pitch,this.velo=arguments[0].velo,this.start=arguments[0].start,this.end=arguments[0].end):(this.pitch=arguments[0],this.velo=arguments[1],this.start=arguments[2],this.end=arguments[3])},valueOf:function(){return this.start},toString:function(){return this.pitch+":"+this.velo+":"+this.start+":"+this.end}},NoteList.prototype={add:function(note){if(null===this.head)return this.head=note,this.playhead=this.head,void this.size++;if(note<=this.head)return note.next=this.head,this.head=note,void this.size++;for(var curr=this.head;curr;){if(note>curr){if(!curr.next){curr.next=note;break}if(note<=curr.next){note.next=curr.next,curr.next=note;break}}curr=curr.next}return void this.size++},empty:function(){this.head=null,this.playhead=null,this.size=0},findNoteAtPosition:function(pitch,tick){for(var curr=this.head;curr;){if(curr.pitch===pitch&&curr.start<=tick&&tick<=curr.end)return curr;curr=curr.next}return null},findNotesInArea:function(minPitch,maxPitch,start,end){for(var notesInTimeSpan=this.findNotesInTimeSpan(start,end),notesInArea=[],i=0;i<notesInTimeSpan.length;i++){var p=notesInTimeSpan[i].pitch;minPitch>p||p>maxPitch||notesInArea.push(notesInTimeSpan[i])}return notesInArea},findNotesInTimeSpan:function(start,end){for(var curr=this.head,bucket=[];curr&&curr.start<=end;)start<=curr.start&&bucket.push(curr),curr=curr.next;return bucket.length>0?bucket:0},getSize:function(){return this.size},getArray:function(){for(var curr=this.head,bucket=[];curr;)bucket.push(curr),curr=curr.next;if(bucket.length>0){for(var i=0;i<bucket.length;i++)bucket[i].next=null;return bucket}return null},iterate:function(fn){for(var curr=this.head,index=0;curr;)fn(curr,index++),curr=curr.next},remove:function(note){if(null!==this.head){var removed;if(this.head===note)return removed=this.head,this.head=this.head.next,removed.next=null,this.size--,removed;for(var curr=this.head;curr;){if(curr.next===note)return removed=curr.next,curr.next=curr.next.next,removed.next=null,this.size--,removed;curr=curr.next}return null}},rewind:function(){this.playhead=this.head},setPlayheadAtTick:function(tick){if(this.playhead=this.head,this.playhead)for(;this.playhead.start<tick;)this.playhead=this.playhead.next},scan:function(end){if(this.playhead){for(var bucket=[];this.playhead.start<end;)bucket.push(this.playhead),this.playhead=this.playhead.next;return bucket.length>0?bucket:null}},dump:function(){for(var curr=this.head,bucket=[];curr;)bucket.push(curr.toString()),curr=curr.next;return bucket}},Transport.prototype={tick2sec:function(tick){return tick*this.TIS},sec2tick:function(sec){return sec/this.TIS},getAbsTimeInSec:function(tick){return this.absOrigin+this.tick2sec(tick)},getBPM:function(){return this.BPM},getNowInSec:function(){return this.now},getNow:function(){return this.sec2tick(this.now)},getLoopDurationInSec:function(){return this.loopEnd-this.loopStart},getLoopDuration:function(){return this.sec2tick(this.getLoopDurationInSec())},setBPM:function(BPM){this.BPM=BPM;var factor=this.oldBPM/this.BPM;this.oldBPM=this.BPM,this.BIS=60/this.BPM,this.TIS=this.BIS/TICKS_PER_BEAT,this.lookahead=32*this.TIS,this.now*=factor,this.loopStart*=factor,this.loopEnd*=factor,this.absOrigin=WX.now-this.now},setNowInSec:function(sec){this.now=sec,this.absOrigin=WX.now-this.now;for(var tick=this.sec2tick(this.now),i=0;i<this.notelists.length;i++)this.notelists[i].setPlayheadAtTick(tick)},setNow:function(tick){this.setNowInSec(this.tick2sec(tick))},setLoop:function(start,end){this.loopStart=this.tick2sec(start),this.loopEnd=this.tick2sec(end)},step:function(){if(this.RUNNING){var absNow=WX.now;this.now+=absNow-this.absOldNow,this.absOldNow=absNow,this.scanNotes(),this.flushPlaybackQ(),this.LOOP&&this.loopEnd-(this.now+this.lookahead)<0&&this.setNowInSec(this.loopStart-(this.loopEnd-this.now))}},scanNotes:function(){for(var i=0;i<this.notelists.length;i++){var end=this.sec2tick(this.now+this.lookahead),notes=this.notelists[i].scan(end);notes&&Array.prototype.push.apply(this.playbackQ,notes)}},setScanPosition:function(sec){for(var i=0;i<this.notelists.length;i++)this.notelists[i].setPlayheadAtTick(this.sec2tick(sec))},_loop:function(){this.step(),this.updateView(),requestAnimationFrame(this._loop.bind(this))},isRunning:function(){return this.RUNNING},start:function(){this.playbackQ.length=0,this.setScanPosition(this.now);var absNow=WX.now;this.absOrigin=absNow-this.now,this.absOldNow=absNow,this.RUNNING=!0},pause:function(){this.RUNNING=!1},rewind:function(){this.setNowInSec(0)},addNoteList:function(notelist){this.notelists.push(notelist)},removeNoteList:function(){},flushPlaybackQ:function(){this.playbackQ.length=0},updateView:function(viewdata){for(var i=0;i<this.views.length;i++)this.views[i].update(viewdata[i])}},{Util:{tick2mbt:tick2mbt,mbt2tick:mbt2tick},createNote:function(){var n=new Note;return n.set.apply(n,arguments),n},createNoteList:function(){return new NoteList},Transport:new Transport(120)}}(WX);
//# sourceMappingURL=waax.map
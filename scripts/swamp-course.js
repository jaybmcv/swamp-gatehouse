// Shared MML course. Geometry motion, not an avatar impulse API.
// COURSE is injected by the build script. Keep the locked launch constants intact.
var motion={distance:9,lift:4,out:350,back:350,release:60,restore:60,cooldown:1000};
var safeMotion={up:600,hold:1200,down:600,cooldown:1000};
var doors=[],round=0,attempts=0,launches=0,opened=0,finishTouches=0;
var resetAt=0,lastFinish=-10000,started=Date.now(),lastError='';
var values={};
function el(id){return document.getElementById(id);}
function set(id,key,value){
 var v=String(value),k=id+':'+key;
 if(values[k]===v)return;
 el(id).setAttribute(key,v);values[k]=v;
 if((key==='y'||key==='z')&&/^gate-\d+-\d+$/.test(id)){var visual=el(id+'-visual');if(visual)visual.setAttribute(key,v);}
}
function sign(d,text,color){set(d.id+'-sign','content',text);set(d.id+'-sign','color',color||'#203c32');}
function home(d){
 set(d.id,'y',1.75);set(d.id,'z',d.z-.75);
 set(d.id+'-pad','y',0);set(d.id+'-pad','z',d.z+2.2);
 set(d.id,'collide',true);set(d.id+'-pad','collide',true);
}
function prepare(){
 round++;attempts=0;launches=0;opened=0;finishTouches=0;lastFinish=-10000;resetAt=0;
 for(var r=0;r<COURSE.rows;r++){
  var choices=[0,1,2,3,4,5,6,7];
  for(var j=7;j>0;j--){var k=Math.floor(Math.random()*(j+1)),tmp=choices[j];choices[j]=choices[k];choices[k]=tmp;}
  doors.forEach(function(d){if(d.row!==r)return;d.safe=choices.slice(0,COURSE.safeCounts[r]).indexOf(d.col)!==-1;d.start=null;d.open=false;home(d);sign(d,d.letter);});
  set('row-'+r,'content','GATE '+(r+1)+' / FIND A WAY');
 }
 set('reset-label','content','RESET / ENTER CODE');
}
function touch(d){
 if(resetAt||d.open||d.start!==null)return;
 attempts++;d.start=Date.now();
 if(d.safe){d.open=true;opened++;set(d.id,'collide',false);sign(d,d.letter+' / GO','#285c45');}
 else{launches++;sign(d,d.letter+' / WRONG','#713e31');}
}
function requestReset(){
 if(resetAt)return;
 resetAt=Date.now()+10000;
 set('reset-label','content','CLEAR DOORS / 10s');
}
function tick(){
 var now=Date.now();
 if(resetAt&&now>=resetAt)prepare();
 doors.forEach(function(d){
  if(d.start===null)return;
  var t=now-d.start;
  if(d.safe){
   var closeAt=safeMotion.up+safeMotion.hold,endAt=closeAt+safeMotion.down;
   var rise=t<safeMotion.up?t/safeMotion.up:t<closeAt?1:Math.max(0,1-(t-closeAt)/safeMotion.down);
   set(d.id,'y',1.75+4.8*rise);
   // Stay non-solid throughout descent; restore only after reaching home.
   if(t>=endAt){if(d.open){d.open=false;opened--;home(d);sign(d,d.letter);}if(t>=endAt+safeMotion.cooldown)d.start=null;}
   return;
  }
  var solid=!(t>=motion.out-motion.release&&t<motion.out+motion.restore);
  if(!solid){set(d.id,'collide',false);set(d.id+'-pad','collide',false);}
  var p=t<motion.out?t/motion.out:t<motion.out+motion.back?1-(t-motion.out)/motion.back:0;
  set(d.id,'y',1.75+motion.lift*p);set(d.id,'z',d.z-.75+motion.distance*p);
  set(d.id+'-pad','y',motion.lift*p);set(d.id+'-pad','z',d.z+2.2+motion.distance*p);
  if(solid){set(d.id,'collide',true);set(d.id+'-pad','collide',true);}
  if(t>=motion.out+motion.back+motion.cooldown){d.start=null;sign(d,d.letter);}
 });
}
function heartbeat(){
 var status='ROUND '+round+' / OPEN '+opened+' / PUSHES '+launches+' / LIVE '+Math.floor((Date.now()-started)/1000)+'s';
 if(resetAt){status='CLEAR DOORWAYS / NEW ROUTE IN '+Math.max(0,Math.ceil((resetAt-Date.now())/1000))+'s';set('reset-label','content',status);}
 if(lastError)status='SCRIPT ERROR / '+lastError;
 set('status','content',status);set('finish-status','content','FINISH / CONTACTS '+finishTouches);
}
for(var r=0;r<COURSE.rows;r++)for(var c=0;c<8;c++){
 var d={id:'gate-'+r+'-'+c,row:r,col:c,z:-r*COURSE.spacing,letter:String.fromCharCode(65+c),safe:false,open:false,start:null};doors.push(d);
 (function(door){['collisionstart','collisionmove','click'].forEach(function(event){[door.id,door.id+'-pad'].forEach(function(id){el(id).addEventListener(event,function(){touch(door);});});});})(d);
}
el('reset-auth').addEventListener('prompt',function(event){if(event && event.detail && event.detail.value === 'demo-reset')requestReset();});
el('finish-pad').addEventListener('collisionstart',function(){var now=Date.now();if(resetAt||now-lastFinish<1000)return;lastFinish=now;finishTouches++;heartbeat();});
prepare();heartbeat();
setInterval(function(){try{tick();}catch(e){lastError=String(e.message||e);}},5);
setInterval(heartbeat,1000);


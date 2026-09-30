import fs from 'node:fs';
import assert from 'node:assert/strict';
const H=9,parts=[];
function cube(id,x,y,z,w,h,d,color,solid=true,extra=''){parts.push(`<m-cube id="host-${id}" x="${x}" y="${y}" z="${z}" width="${w}" height="${h}" depth="${d}" color="${color}" collide="${solid}" cast-shadows="false" ${extra}></m-cube>`);}
function label(id,text,x,y,z,ry=0){parts.push(`<m-label id="host-${id}" content="${text}" x="${x}" y="${y}" z="${z}" ry="${ry}" width="5.5" height="0.65" font-size="24" color="#263e35" font-color="#d4c49a" collide="false"></m-label>`);}
// Top surface 9m above the course; clear view over the roughly 7.5m roof pavilions.
for(const x of [17.65,24.35]){
 cube('rail-'+x,x,H+.55,-75,.18,1.1,162,'#5f513b',true,'opacity="0"');
 for(const y of [H+.2,H+.65,H+1.05])cube('timber-rail-'+x+'-'+y,x,y,-75,.2,.16,162,'#493527',false);
 for(let z=-155;z<6;z+=1.5)cube('baluster-'+x+'-'+z,x,H+.6,z,.13,1.1,.13,'#51402e',false);
 cube('railcap-'+x,x,H+1.13,-75,.25,.12,162,'#5f4932',false);
 const outer=x>20,postTop=outer?12.8:10.4,postX=outer?24.5:17.2;
 for(let z=-154;z<=6;z+=4){
  cube('post-'+x+'-'+z,postX,postTop/2,z,.94,postTop,.62,'#443124');
  cube('postcap-'+x+'-'+z,postX,postTop+.08,z,1.04,.16,.72,'#705234',false);
  for(const y of [H-.25,H+1.12,postTop-.35])cube('post-binding-'+x+'-'+z+'-'+y,postX,y,z,.98,.12,.68,'#8d784d',false);
 }

}
// Outside screen wall: continuous timber bays, leaving the course-facing rail open.
for(let z=-151.5;z<6;z+=9){
 cube('outer-wall-'+z,24.38,10.7,z,.22,3.4,8.5,'#69503a',true);
 for(const y of [9.2,10.05,12.2,12.6])cube('outer-beam-'+z+'-'+y,24.18,y,z,.3,.18,8.7,'#3e2c20',false);
 for(let j=0;j<12;j++){
  const zz=z-4.05+j*.735;
  cube('outer-board-'+zz,24.2,10.65,zz,.12,2.85,.68,['#6b4e32','#795b3d','#61472f'][j%3],false);
  cube('outer-grain-'+zz,24.13,10.65,zz,.025,2.6,.018,'#3e2c20',false);
 }
 for(const zz of [z-3,z,z+3]){
  cube('outer-panel-'+zz,24.07,11.2,zz,.14,1.3,1.6,'#42372a',false);
  for(const dz of [-.5,0,.5])cube('outer-lattice-'+zz+'-'+dz,23.96,11.2,zz+dz,.09,1.2,.075,'#a08555',false);
  cube('outer-panel-sill-'+zz,23.94,10.5,zz,.25,.12,1.8,'#57402b',false);
 }
 cube('outer-wall-cap-'+z,24.35,12.85,z,.8,.16,9.1,'#3f4c39',false);
}
for(let z=-155.6,i=0;z<6;z+=.8,i++){
 cube('plank-'+i,21,H+.016,z,6.5,.028,.765,['#8c6742','#a07a50','#785534','#947047'][i%4],false);
 for(let j=0;j<2;j++)cube('grain-'+i+'-'+j,21+(i%3-1)*.3,H+.033,z-.2+j*.32,4.8+(i%4)*.3,.009,.018,'#60452f',false);
}
// Castle-like final wall: pale plaster, dark timber framing, seven stepped roof tiers.
// Decorative structure stays behind the finish, clear of every moving gate.
parts.push('<m-group id="host-castle-monument" z="-2.3" y="-7.2" sy="3.4" sx="1.2">');
for(const [level,y,w,h] of [[0,3.9,45,3.8],[1,7.6,40,3.6],[2,11.2,35,3.6],[3,14.8,29,3.6],[4,18.4,23,3.6],[5,22,18,3.6],[6,25.6,12,3.6]]){
 cube('castle-wall-'+level,0,y,-178,w,h,2.2,'#c7bda1',false);
 for(let x=-w/2+.3;x<w/2;x+=3)cube('castle-frame-'+level+'-'+x,x,y,-176.83,.23,h,.18,'#443027',false);
 for(const yy of [y-h/2+.18,y+h/2-.18])cube('castle-beam-'+level+'-'+yy,0,yy,-176.72,w,.28,.3,'#654730',false);
 for(let x=-w/2+2;x<w/2-1;x+=3){cube('castle-window-'+level+'-'+x,x,y+.6,-176.68,1.1,1.7,.1,'#272f2c',false);for(const dx of [-.3,0,.3])cube('castle-lattice-'+level+'-'+x+'-'+dx,x+dx,y+.6,-176.6,.07,1.65,.07,'#a28655',false);}
 // Recessed window surrounds, horizontal lattice and projecting timber sills.
 for(let x=-w/2+2;x<w/2-1;x+=3){
  for(const dx of [-.64,.64])cube('window-jamb-'+level+'-'+x+'-'+dx,x+dx,y+.6,-176.49,.13,1.94,.22,'#513b29',false);
  for(const dy of [-.32,.2,1.02,1.53])cube('window-crossbar-'+level+'-'+x+'-'+dy,x,y+dy,-176.44,1.32,.07,.19,'#826443',false);
  cube('window-sill-'+level+'-'+x,x,y-.33,-176.35,1.6,.12,.52,'#55402c',false);
 }
 // Corner bindings anchor each setback; inset lower panels break up the plaster.
 for(const side of [-1,1]){
  cube('corner-pier-'+level+'-'+side,side*(w/2-.12),y,-176.65,.48,h,.42,'#3c3026',false);
  for(const dy of [-h/2+.4,h/2-.45])cube('corner-binding-'+level+'-'+side+'-'+dy,side*(w/2-.12),y+dy,-176.39,.55,.12,.08,'#a88b54',false);
 }
 for(let x=-w/2+1.5;x<w/2-1;x+=3){
  cube('lower-panel-'+level+'-'+x,x,y-h/2+.65,-176.7,2.3,.73,.17,['#766044','#68553e','#826b4c'][level%3],false);
  for(const dy of [-.24,.24])cube('panel-trim-'+level+'-'+x+'-'+dy,x,y-h/2+.65+dy,-176.58,2.08,.04,.09,'#a58b5e',false);
 }
 // Repeated timber courses, paired brackets, roof ribs and ornamental panels.
 for(let yy=y-h/2+2;yy<y+h/2-1;yy+=2.4){
  cube('castle-course-'+level+'-'+yy,0,yy,-176.64,w,.10,.26,'#705036',false);
  for(let x=-w/2+1.5;x<w/2;x+=3){
   cube('castle-panel-'+level+'-'+yy+'-'+x,x,yy+.65,-176.60,1.2,.7,.16,'#8c6843',false);
   cube('castle-panel-inlay-'+level+'-'+yy+'-'+x,x,yy+.65,-176.48,.42,.42,.08,'#c1a469',false,'rz="45"');
  }
 }
 const roofY=y+h/2+.3;
 for(let x=-w/2+.8;x<w/2;x+=1.5){
  cube('castle-bracket-'+level+'-'+x,x,roofY-.48,-176.1,.24,.35,1.5,'#654730',false);
  cube('castle-bracket-gold-'+level+'-'+x,x,roofY-.32,-175.6,.42,.12,.48,'#ae9058',false);
  for(const side of [-1,1])cube('castle-roof-rib-'+level+'-'+x+'-'+side,x,roofY+.15,-178+side*1.8,.065,.07,4,'#69806a',false,`rx="${side*16}"`);
 }
 for(const side of [-1,1]){
  cube('castle-roof-'+level+'-'+side,0,roofY,-178+side*1.8,w+3,.24,4,'#32594c',false,`rx="${side*16}"`);
  cube('castle-eave-'+level+'-'+side,0,roofY-.5,-178+side*3.65,w+3.6,.13,.23,'#b69a5d',false);
  for(let k=0;k<5;k++)cube('castle-tip-'+level+'-'+side+'-'+k,side*(w/2+1+k*.28),roofY+.15+k*k*.06,-178,.44,.18,7.2,'#32594c',false,`rz="${side*k*7}"`);
 }
 for(let x=-w/2+.5;x<w/2;x+=3){
  cube('eave-drop-'+level+'-'+x,x,roofY-.65,-175.1,.18,.48,.27,'#4b3526',false);
  cube('eave-block-'+level+'-'+x,x,roofY-.45,-174.95,.62,.12,.46,'#886b40',false);
 }
 cube('castle-ridge-'+level,0,roofY+.66,-178,w+3.5,.2,.3,'#a28d55',false);
}
cube('castle-crest',0,25.6,-176.5,1.6,1.6,.16,'#b59a59',false,'rz="45"');
cube('crest-surround',0,25.6,-176.55,2.05,2.05,.12,'#3c3026',false,'rz="45"');
for(const x of [-3.8,3.8]){
 cube('top-banner-'+x,x,25.2,-176.4,.7,1.65,.12,'#70453a',false);
 cube('top-banner-crest-'+x,x,25.45,-176.29,.32,.32,.1,'#c6ac70',false,'rz="45"');
}
parts.push('</m-group>');
// Broad footing sinks below course grade; rearward offset clears the host stair landing.
cube('castle-foundation',0,1,-181,58,3,6.2,'#514d40',false);
cube('castle-foundation-cap',0,2.55,-181,56,.3,6.2,'#766d55',false);
for(let row=0;row<3;row++)for(let i=0;i<19;i++){
 const x=-27+i*3+(row%2)*.6;
 cube('castle-foundation-stone-'+row+'-'+i,x,.1+row*.8,-177.84,2.85,.72,.18,['#605c4e','#6b6553','#555345'][(i+row)%3],false);
}

// Ground-level infill overlaps the course edge and supports both stair approaches.
cube('ground-infill',20.8,-.2,-75,7.8,.4,206,'#66513a',true);
for(const startZ of [6,-178])for(let i=0;i<28;i++){
 const z=startZ+i*.8;
 cube('landing-plank-'+startZ+'-'+i,20.8,.012,z,7.76,.022,.77,['#705036','#79583b','#62452e'][i%3],false);
 for(const dz of [-.2,.18])cube('landing-grain-'+startZ+'-'+i+'-'+dz,20.8,.026,z+dz,7.5,.008,.018,'#493322',false);
}
// Two straight 45-step flights: 0.2m rises and 0.4m treads, 6.5m wide.
for(const end of ['start','finish']){
 const front=end==='start',base=front?24:-174,dir=front?-1:1;
 cube(end+'-landing',21,-.1,front?26:-176,7,.2,4,'#66513a');
 for(let i=0;i<45;i++){
  const top=(i+1)*.2,z=base+dir*(i+.5)*.4;
  cube(end+'-step-'+i,21,top-.11,z,6.5,.22,.42,i%2?'#61452f':'#705035');
  cube(end+'-nosing-'+i,21,top+.012,z-dir*.15,6.5,.025,.05,'#493222',false);
  for(let g=0;g<3;g++)cube(end+'-woodgrain-'+i+'-'+g,21+(i%3-1)*.2,top+.018,z-.12+g*.11,5.8,.012,.014,'#3e2d20',false);
  for(const x of [19.35,21,22.65])cube(end+'-plankseam-'+i+'-'+x,x,top+.018,z,.024,.012,.38,'#35271c',false);
  for(const x of [17.65,24.35])cube(end+'-guard-'+x+'-'+i,x,top+.55,z,.18,1.1,.43,'#5f513b',true,'opacity="0"');
 }
 for(const x of [17.65,24.35]){
  for(const offset of [.45,1.1])cube(end+'-sloping-rail-'+x+'-'+offset,x,4.6+offset,base+dir*9,.22,.18,Math.sqrt(18*18+9*9),'#493222',false,`rx="${-dir*26.565051}"`);
  for(let i=0;i<=44;i+=4){const z=base+dir*(i+.5)*.4,top=(i+1)*.2;cube(end+'-rail-post-'+x+'-'+i,x,top+.58,z,.19,1.16,.19,'#59402b',false);}
 }
 label(end+'-sign','HOST WALK / STAIRS UP',21,1.8,front?24.8:-174.8,front?0:180);
 label(end+'-top','HOST VIEW / 9m',21,H+1.8,front?4:-154,front?180:0);
}
const additions=parts.join('\n');
for(const suffix of ['', '-preview']){
 let original=fs.readFileSync(`examples/swamp-full-course-weathered${suffix}.html`,'utf8');
 original=original.replace(/var motion=[\s\S]*?(?=\n\/\/\]\]>)/,fs.readFileSync('scripts/swamp-course.js','utf8').split('var motion=')[1] ? 'var motion='+fs.readFileSync('scripts/swamp-course.js','utf8').split('var motion=')[1].trimEnd() : '');
 original=original.replace(/(<m-cube id="reset"[^>]*><\/m-cube>)/,'<m-prompt id="reset-auth" message="Enter course reset code" prefill="">$1</m-prompt>');
 let html=original.replace(/<m-cube id="return-deck"[^>]*><\/m-cube>/,'<m-cube id="return-deck" x="21" y="8.8" z="-75" width="7" height="0.4" depth="162" color="#4b5340" collide="true"></m-cube>');
 html=html.replace(/<m-label id="return-sign-[^"]*"[^>]*><\/m-label>/g,'');
 html=html.replace('content="RETURN WALKWAY  >"','content="HOST STAIRS / RIGHT  >"');
 html=html.replace('<script>',additions+'\n<script>');
 assert.equal(original.match(/<script>[\s\S]*<\/script>/)[0],html.match(/<script>[\s\S]*<\/script>/)[0]);
 const doorTags=s=>[...s.matchAll(/<m-cube id="gate-[^"]*"[^>]*>/g)].map(m=>m[0]);assert.deepEqual(doorTags(html),doorTags(original));
 fs.writeFileSync(`examples/swamp-full-course-host-walk${suffix}.html`,html);
}
const triangles=179980+parts.filter(s=>s.startsWith('<m-cube')).length*12+8-16*2;
fs.writeFileSync('builds/swamp-gatehouse-v2/host-walk.json',JSON.stringify({height:H,castleHeightApprox:90,castleVerticalScale:3.4,width:7,deckLength:162,stairs:{ends:2,steps:45,rise:.2,tread:.4},totalAuthoredTriangles:triangles,gameplay:'script and gate collider tags unchanged',nativeWalkTest:'pending'},null,2));
console.log({triangles,elements:parts.length});


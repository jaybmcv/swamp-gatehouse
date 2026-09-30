import fs from 'node:fs';
import crypto from 'node:crypto';
const config={rows:10,columns:8,spacing:18,safeCounts:[4,4,3,3,3,2,2,2,2,2]};
const end=-(config.rows-1)*config.spacing-16, length=28-end, center=(28+end)/2;
let parts=['<!-- Swamp Gatehouse full course. Locked 60/60 launch. -->','<m-group y="0.05">'];
let cubes=0,labels=0;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function cube(id,x,y,z,w,h,d,color,solid=true,extra=''){
 cubes++;parts.push(`<m-cube id="${id}" x="${x}" y="${y}" z="${z}" width="${w}" height="${h}" depth="${d}" color="${color}" collide="${solid}" ${extra}></m-cube>`);
}
function label(id,text,x,y,z,w=12,h=.7,extra=''){
 labels++;parts.push(`<m-label id="${id}" content="${esc(text)}" x="${x}" y="${y}" z="${z}" width="${w}" height="${h}" font-size="26" alignment="center" color="#203c32" font-color="#d8c99e" collide="false" ${extra}></m-label>`);
}
// Main deck: z -106 to +28. Front and rear crossovers connect the isolated return walk.
cube('deck',0,-.2,center,34.4,.4,length,'#66513a');
cube('return-deck',21,-.2,center,7,.4,length,'#4b5340');
cube('start-crossover',17.4,-.2,24,1,.4,8,'#66513a');
cube('finish-crossover',17.4,-.2,end+4,1,.4,8,'#66513a');
// High boundaries stop ordinary ground bypass; no claim against flying or special avatars.
cube('west-boundary',-17.2,3,center,.5,6,length,'#394b3f');
cube('return-divider',17.2,3,center,.5,6,length-16,'#394b3f');
cube('east-boundary',24.5,1.2,center,.4,2.4,length,'#394b3f');
cube('finish-boundary',3.6,1.5,end,41.5,3,.4,'#394b3f');
// Wide start ramp, decorative deck joints, and low return-path markers.
cube('entry-ramp',0,-.23,30,16,.35,4.6,'#66513a',true,'rx="6"');
for(let z=end+2;z<=26;z+=2)cube('joint-'+z,0,.006,z,34,.012,.04,'#433b2f',false);
for(let z=end+10;z<22;z+=12){
 cube('return-stripe-'+z,21,.012,z,4,.024,.16,'#a28f55',false);
 label('return-sign-'+z,'RETURN TO START',21,.7,z,5,.55,'ry="180"');
}
for(let r=0;r<config.rows;r++){
 const z=-r*18;
 for(let j=0;j<=8;j++){
  const x=-16.8+j*4.2;
  cube(`post-${r}-${j}`,x,2.25,z,1,4.5,1.2,'#382f25');
  cube(`cap-${r}-${j}`,x,4.65,z,1.2,.3,1.6,'#80704d',false);
  cube(`moss-${r}-${j}`,x,3.6,z+.66,.7,.55,.12,'#4a5e39',false);
 }
 cube('lintel-'+r,0,3.85,z,34.4,1,1.2,'#493b29');
 cube('roof-front-'+r,0,4.8,z+.9,35.4,.25,2.2,'#294e43',false,'rx="15"');
 cube('roof-back-'+r,0,4.8,z-.9,35.4,.25,2.2,'#294e43',false,'rx="-15"');
 cube('ridge-'+r,0,5.15,z,35.8,.24,.35,'#52684c',false);
 label('row-'+r,'GATE '+(r+1)+' / FIND A WAY',0,6.2,z,20,.85);
 // Safe and wrong choices look identical before discovery.
 for(let c=0;c<8;c++){
  const x=-14.7+c*4.2,id='gate-'+r+'-'+c;
  cube(id,x,1.75,z-.75,4,4.5,3,'#806344',true,'collision-interval="100"');
  parts.push(`<m-group id="${id}-visual" x="${x}" y="1.75" z="${z-.75}">`);
  for(let j=0;j<8;j++)cube(id+'-plank-'+j,-1.73+j*.495,0,1.52,.475,4.36,.07,['#876747','#98734d','#755637'][j%3],false);
  for(const yy of [-1.78,0,1.78])cube(id+'-strap-'+yy,0,yy,1.58,3.92,.12,.1,'#302e27',false);
  for(const xx of [-1.72,1.72])for(const yy of [-1.78,0,1.78])cube(id+'-stud-'+xx+'-'+yy,xx,yy,1.65,.11,.11,.05,'#b59959',false);
  cube(id+'-handle',1.25,-.25,1.69,.12,.4,.16,'#b59959',false);
  parts.push('</m-group>');
  cube(id+'-pad',x,0,z+2.2,3.2,.3,3,'#a18b43',true,'rx="0" collision-interval="100"');
  label(id+'-sign',String.fromCharCode(65+c),x,4.35,z+1.4,3.7,.6);
  cube(id+'-lane',x,.012,z+11,3.3,.024,.15,'#9b8857',false);
 }
 // Lanterns use muted solid colors, no lights or emissive bloom.
 for(const x of [-16.8,16.8]){
  cube(`lantern-frame-${r}-${x}`,x,3,z+1.15,.48,.85,.48,'#2c332b',false);
  cube(`lantern-paper-${r}-${x}`,x,3,z+1.41,.34,.62,.04,'#b49a61',false);
 }
 if(r<config.rows-1)label('court-'+r,'COURTYARD '+(r+1)+' / KEEP GOING',0,.65,z-8,17,.65);
}
label('title','SWAMP GATEHOUSE',0,8,7,26,1.25);
label('status','PREPARING COURSE',0,6.9,7,29,.85);
label('howto','TEN GATES / FIND THE OPEN DOORS',0,2.5,21,23,.85);
label('howto-2','Touch a pad. Wrong doors send you back.',0,1.6,21,23,.65);
cube('start-line',0,.016,16,33,.032,.45,'#baaa72',false);
label('start-mark','START',0,.04,16,9,1.2,'rx="-90"');
cube('reset',-13,1,22,1.6,1.6,1.2,'#715343');
label('reset-label','NEW ROUTE / CLICK',-13,2.4,22,6,.65);
cube('finish-pad',0,.025,end+7,31,.05,2,'#8b9867',true,'collision-interval="100"');
label('finish-title','YOU MADE IT',0,5,end+5,22,1.2);
label('finish-status','FINISH / CONTACTS 0',0,3.8,end+5,21,.8);
label('finish-exit','RETURN WALKWAY  >',10,2,end+4,12,.65);
// Exterior feet and pilings give the course a timber platform silhouette.
for(let z=end+4;z<28;z+=9)for(const x of [-17.2,24.5]){
 cube(`pile-${x}-${z}`,x,-1.8,z,.8,3.6,.8,'#382f25');
 cube(`pile-cap-${x}-${z}`,x,.2,z,1,.2,1,'#736044',false);
}
// Noncolliding architectural detail adapted from the earlier gatehouse kit.
for(let z=end+1;z<28;z+=.85)for(let c=0;c<9;c++)cube(`plank-${z}-${c}`,-15.15+c*3.79,.018,z,3.75,.024,.81,['#715439','#826445','#695139'][(Math.round((z-end)/.85)+c)%3],false);
for(let r=0;r<config.rows;r++){
 const z=-r*config.spacing;
 for(let j=0;j<=8;j++){
  const x=-16.8+j*4.2;
  for(let k=0;k<7;k++)cube(`stone-${r}-${j}-${k}`,x,.3+k*.48,z+.65,.96,.44,.12,k%3===0?'#67705a':'#737566',false);
  for(const yy of [.5,2.8])cube(`binding-${r}-${j}-${yy}`,x,yy,z+.75,1.04,.09,.12,'#a7996e',false);
 }
 for(const side of [-1,1]){
  cube(`eave-${r}-${side}`,0,4.52,z+side*1.95,35.6,.09,.12,'#b49b59',false);
  cube(`tip-${r}-${side}`,side*17.2,5,z,1.7,.25,4,'#315b49',false,`rz="${side*16}"`);
  cube(`banner-pole-${r}-${side}`,side*18.1,3.4,z,.12,6.8,.12,'#4b3729',false);
  cube(`banner-${r}-${side}`,side*18.1,4.2,z+.15,1.15,2.4,.08,r%2?'#826442':'#753f3b',false);
  label(`banner-glyph-${r}-${side}`,String(r+1).padStart(2,'0'),side*18.1,4.2,z+.22,.9,.65);
 }
 for(let x=-16.5;x<17;x+=1.1)for(const side of [-1,1])cube(`roof-rib-${r}-${x}-${side}`,x,4.96,z+side*.9,.055,.08,2.18,'#476858',false,`rx="${side*15}"`);
 for(const x of [-16.8,-8.4,8.4,16.8]){
  cube(`lamp-hook-${r}-${x}`,x,3.55,z+1.1,.08,.75,.1,'#332d24',false);
  cube(`lamp-body-${r}-${x}`,x,3.1,z+1.3,.52,.65,.48,'#b8a577',false);
  for(const yy of [2.73,3.46])cube(`lamp-cap-${r}-${x}-${yy}`,x,yy,z+1.3,.68,.12,.62,'#3e3b2b',false);
  for(const dx of [-.26,.26])cube(`lamp-rib-${r}-${x}-${dx}`,x+dx,3.1,z+1.55,.055,.65,.05,'#443828',false);
 }
}
for(let z=end+4;z<28;z+=4)for(const x of [-17.2,17.2,24.5]){
 cube(`rail-post-${x}-${z}`,x,3,z,.7,6.1,.35,'#4a3b2c',false);
 cube(`rail-cap-${x}-${z}`,x,6.12,z,.82,.14,.5,'#9c895a',false);
}
for(let z=end+9;z<20;z+=12){
 cube('planter-'+z,23.6,.35,z,1.1,.7,1.4,'#594433',false);
 for(let j=0;j<5;j++)cube(`reed-${z}-${j}`,23.25+j*.16,1.05+(j%2)*.2,z,.06,1.4+(j%2)*.4,.13,'#657449',false,`rz="${(j-2)*9}"`);
}
parts.push('<script>\n//<![CDATA[\nvar COURSE='+JSON.stringify(config)+';\n'+fs.readFileSync('scripts/swamp-course.js','utf8')+'\n//]]>\n</script></m-group>');
const html=parts.join('\n');
fs.mkdirSync('builds/swamp-gatehouse-v2',{recursive:true});
fs.writeFileSync('examples/swamp-full-course.html',html);
const lights=Array.from({length:config.rows+2},(_,i)=>`<m-light type="point" cast-shadows="false" intensity="1000" y="14" z="${20-i*18}"></m-light>`).join('');
fs.writeFileSync('examples/swamp-full-course-preview.html',html.replace('<m-group y="0.05">','<m-group y="0.05">'+lights));
fs.writeFileSync('builds/swamp-gatehouse-v2/swamp-full-course.html',html);
const manifest={...config,cubes,labels,authoredTriangles:cubes*12+labels*2,bytes:Buffer.byteLength(html),sha256:crypto.createHash('sha256').update(html).digest('hex'),motion:{distance:9,lift:4,out:350,back:350,release:60,restore:60},dimensions:{width:42,length:length+5},nativeFullCourseTest:'pending',capacity:'100 player design target, unverified'};
fs.writeFileSync('builds/swamp-gatehouse-v2/manifest.json',JSON.stringify(manifest,null,2));
console.log(manifest);



import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {validateBytes} from 'gltf-validator';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}};
const pieces=[];
const wood='#453126', cut='#927452', gold='#a59057', iron='#343a36';
function geometry(g,x,y,z,color,rx=0,ry=0,rz=0){
 if(g.index)g=g.toNonIndexed();
 g.deleteAttribute('uv');
 g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1)));
 const c=new T.Color(color),colors=[];for(let i=0;i<g.attributes.position.count;i++)colors.push(c.r,c.g,c.b);
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));pieces.push(g);
}
function box(x,y,z,w,h,d,c,rz=0,rx=0){geometry(new T.BoxGeometry(w,h,d),x,y,z,c,rx,0,rz);}
function beam(a,b,r,c,sides=7){let v=new T.Vector3(...b).sub(new T.Vector3(...a));let g=new T.CylinderGeometry(r*.8,r,v.length(),sides);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));geometry(g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,c);}
function roof(x,y,z,w,d,c){
 // Cross-section rises at the ridge and curls upward at the outer eave.
 for(const s of [-1,1])for(let k=0;k<8;k++){
  let a=k/8,b=(k+1)/8;
  const height=t=>y+.72*(1-t)+.35*Math.pow(t,6);
  const z1=z+s*a*d/2,z2=z+s*b*d/2,y1=height(a),y2=height(b);
  box(x,(y1+y2)/2,(z1+z2)/2,w,.12,Math.hypot(z2-z1,y2-y1)+.04,c,0,-Math.atan2(y2-y1,z2-z1));
 }
 box(x,y+.78,z,w+.3,.19,.28,gold);
 for(const s of [-1,1]){
  box(x,y+.32,z+s*d/2,w+.25,.13,.18,gold);
  for(let k=0;k<5;k++)box(x+s*(w/2+k*.18),y+.55+k*k*.035,z,.26,.16,d, c,s*k*.09);
 }
 for(let dx=-w/2+.25;dx<w/2;dx+=.55)for(const s of [-1,1])beam([x+dx,y+.8,z],[x+dx,y+.36,z+s*d/2],.025,'#70806a',5);
}
function lantern(x,y,z){
 geometry(new T.CylinderGeometry(.24,.27,.65,8),x,y,z,'#bca77c');
 for(const dy of [-.38,.38])box(x,y+dy,z,.65,.1,.65,wood);
 for(let i=0;i<8;i++){let a=i*Math.PI/4;beam([x+Math.cos(a)*.255,y-.32,z+Math.sin(a)*.255],[x+Math.cos(a)*.255,y+.32,z+Math.sin(a)*.255],.018,iron,4);}
 beam([x,y+.4,z],[x,y+.85,z],.025,iron);
}
const palettes=['#355b50','#4c6254','#485a69','#665547','#405d52'];
for(let row=0;row<10;row++){
 const z=-18*row,roofColor=palettes[row%5];
 // Paired raised roof pavilions leave the central row sign unobstructed.
 for(const s of [-1,1]){
  const x=s*12.6;
  box(x,5.7,z,6.4,.22,2.6,wood);
  for(const dx of [-2.6,2.6]){box(x+dx,6.18,z,.23,1.1,1.8,cut);box(x+dx,5.9,z+1.05,.5,.17,.5,gold);}
  roof(x,6.62+(row%3)*.12,z,7.1,3.6,roofColor);
  // Open lattice vent and geometric carved medallion.
  for(let j=-4;j<=4;j++)box(x+j*.52,6.15,z+.95,.075,.68,.09,wood);
  box(x,6.15,z+1.04,.48,.48,.12,gold,Math.PI/4);
  for(const dx of [-1,1])box(x+dx*.53,6.15,z+1.02,.28,.28,.12,cut,Math.PI/4);
 }
 for(let post=0;post<=8;post++){
  const x=-16.8+post*4.2;
  // Brackets sit above the usable doorway, details hug existing posts.
  for(const s of [-1,1]){
   box(x+s*.45,4.44,z+.83,.84,.14,.28,cut);
   box(x+s*.27,4.2,z+.84,.51,.13,.3,gold);
   beam([x,3.92,z+.83],[x+s*.75,4.54,z+.83],.085,wood);
  }
  for(const y of [1,2.15,3.3]){
   box(x,y,z+.81,.68,.08,.07,iron);
   for(const dx of [-.25,.25])geometry(new T.SphereGeometry(.055,6,4),x+dx,y,z+.87,gold);
  }
  // Fine wood grain is shallow geometry, no bright emissive materials.
  for(let j=0;j<3;j++)box(x-.3+j*.28,2.5,z+.79,.025,1.05+(j%2)*.2,.02,'#39372c',.015*(j-1));
 }
 for(const s of [-1,1]){
  // Banner seams and tassels, outside the gate openings.
  const x=s*18.1;
  for(const dx of [-.53,.53])box(x+dx,4.2,z+.21,.045,2.38,.04,gold);
  for(let k=0;k<5;k++)beam([x-.44+k*.22,3,z+.21],[x-.44+k*.22,2.68+(k%2)*.1,z+.21],.024,gold,4);
  // Root clusters on the outside face of each boundary, not on launch pads.
  const edge=s<0?-17.7:25;
  for(let k=0;k<5;k++){
   let zz=z+(k-2)*.7;
   beam([edge,2.3,z],[edge+s*.4,.6,zz],.17,'#52452f');
   beam([edge+s*.4,.6,zz],[edge+s*(1.3+k*.17),-.3,zz+.5],.14,'#4b4230');
  }
  for(let k=0;k<7;k++){
   const zz=z+(k-3)*.37,xx=edge+s*(.7+(k%3)*.35);
   beam([xx,-.3,zz],[xx+s*.2,1.2+(k%3)*.3,zz+.1],.022,'#747d44',5);
   beam([xx+s*.2,.9,zz+.1],[xx+s*.2,1.3+(k%3)*.3,zz+.1],.055,'#766043',6);
  }
  // Hanging ivy follows wall surfaces, with irregular leaves.
  for(let k=0;k<4;k++){
   const xx=s<0?-16.91:17.48,zz=z+4+k*.48,top=5.9;
   beam([xx,top,zz],[xx,top-1.5-k*.3,zz+.25],.022,'#414e30',5);
   for(let j=0;j<5;j++)geometry(new T.IcosahedronGeometry(.13,0),xx-.06,top-.3-j*.31,zz+(j%2)*.18,['#536740','#687747','#405b38'][j%3]);
  }
 }
}
// Arrival and finish towers are outside the playable width; open central skyline.
for(const end of [false,true]){
 const z=end?-175:22,zoneHeight=end?11.7:8.8;
 for(const s of [-1,1]){
  const x=s<0?-19.4:27;
  box(x,1.2,z,3.2,2.4,3.5,'#626657');
  for(let y=.3;y<2.4;y+=.48)box(x,y,z+1.78,3.22,.025,.06,'#3d453b');
  box(x,4.15,z,2.65,5.8,2.8,wood);
  for(const dx of [-1.38,1.38])box(x+dx,4.4,z+1.46,.2,5.4,.18,cut);
  for(let j=-3;j<=3;j++)box(x+j*.32,5.8,z+1.48,.09,1.6,.09,gold);
  roof(x,7.4,z,4.7,4.5,'#35584c');
  if(end){box(x,8.8,z,1.95,2,2,wood);for(let j=-2;j<=2;j++)box(x+j*.32,8.8,z+1.04,.1,1.4,.1,gold);roof(x,9.9,z,3.65,3.4,'#47614f');}
  beam([x,zoneHeight-.5,z],[x,zoneHeight+.6,z],.075,gold);
  geometry(new T.SphereGeometry(.19,8,6),x,zoneHeight+.65,z,gold);
  lantern(x,3.8,z+2.02);
 }
 // Gold inlaid border frames start/finish, flush decorative geometry.
 for(const s of [-1,1])for(let k=0;k<14;k++)box(s*(2+k),.045,end?-169:18,.55,.015,.55,k%2?cut:gold,0,0);
}
const merged=mergeGeometries(pieces),mesh=new T.Mesh(merged,new T.MeshStandardMaterial({vertexColors:true,roughness:.96}));mesh.name='Swamp architectural detail';
const bytes=new Uint8Array(await new GLTFExporter().parseAsync(mesh,{binary:true}));
const result=await validateBytes(bytes,{uri:'architecture-v3.glb'});if(result.issues.numErrors)throw Error(JSON.stringify(result.issues));
fs.writeFileSync('assets/gatehouse/optimized/architecture-v3.glb',bytes);
const tag='<m-model id="architecture-v3" src="/assets/gatehouse/optimized/architecture-v3.glb" collide="false" cast-shadows="false" clickable="false"></m-model>';
for(const suffix of ['', '-preview']){let input=fs.readFileSync(`examples/swamp-full-course-optimized${suffix}.html`,'utf8');
 input=input.replace(/<m-label id="(title|status)"[^>]*>/g,(label,id)=>label.replace(/ y="[^"]*"/,` y="${id==='title'?9:7.9}"`).replace(/ z="[^"]*"/,' z="22"').replace(/ width="[^"]*"/,` width="${id==='title'?18:20}"`));
 if(suffix)input=input.replaceAll('intensity="900"','intensity="350"');
 fs.writeFileSync(`examples/swamp-full-course-detailed${suffix}.html`,input.replace('<script>',tag+'\n<script>'));}
const baseline=JSON.parse(fs.readFileSync('builds/swamp-gatehouse-v2/optimization.json'));
const report={addedTriangles:merged.attributes.position.count/3,totalAuthoredTriangles:baseline.authoredTriangles+merged.attributes.position.count/3,bytes:bytes.length,errors:result.issues.numErrors,warnings:result.issues.numWarnings,colliders:'unchanged; decoration is noncolliding',nativeVisualReview:'pending'};
fs.writeFileSync('builds/swamp-gatehouse-v2/detail-v3.json',JSON.stringify(report,null,2));console.log(report);

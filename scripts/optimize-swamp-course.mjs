import fs from 'node:fs';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {validateBytes} from 'gltf-validator';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}};
const source=fs.readFileSync('examples/swamp-full-course.html','utf8');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const zones=new Map();let removed=0;const ledger=[];
function box(a){const g=new T.BoxGeometry(+a.width,+a.height,+a.depth).toNonIndexed();g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(+a.x||0,+a.y||0,+a.z||0),new T.Quaternion().setFromEuler(new T.Euler((+a.rx||0)*Math.PI/180,(+a.ry||0)*Math.PI/180,(+a.rz||0)*Math.PI/180)),new T.Vector3(1,1,1)));const color=new T.Color(a.color);g.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:g.attributes.position.count},()=>color.toArray()).flat(),3));return g;}
function add(zone,a){if(!zones.has(zone))zones.set(zone,[]);zones.get(zone).push(box(a));}
let html=source.replace(/<m-group id="(gate-\d+-\d+-visual)"([^>]*)>([\s\S]*?)<\/m-group>/g,(all,id,rest,body)=>{if(!zones.has('door'))for(const m of body.matchAll(/<m-cube\b([^>]*)><\/m-cube>/g))add('door',attrs(m[1]));removed+=(body.match(/<m-cube/g)||[]).length;return `<m-model id="${id}"${rest} src="/assets/gatehouse/optimized/door.glb" collide="false" cast-shadows="false" clickable="false"></m-model>`;});
html=html.replace(/<m-cube\b([^>]*)><\/m-cube>/g,(all,raw)=>{const a=attrs(raw);if(a.collide!=='false')return all;const zone='scenery-'+Math.max(0,Math.min(9,Math.round(-(+a.z||0)/18)));add(zone,a);removed++;return '';});
// Restrained curved eaves, timber braces and trailing moss, outside all door lanes.
for(let r=0;r<10;r++){
 const zone='scenery-'+r,z=-r*18;
 for(const side of [-1,1])for(let j=0;j<5;j++)add(zone,{x:side*(16.4+j*.4),y:5.1+j*j*.035,z,width:.48,height:.16,depth:4.1,rz:side*j*7,color:r%3===1?'#47664e':'#285e51'});
 for(const x of [-16.8,16.8]){
  for(let j=0;j<4;j++)add(zone,{x:x+(j-1.5)*.14,y:3.5-j*.18,z:z+.82,width:.13,height:.8+j*.2,depth:.09,color:'#485f36'});
  add(zone,{x:x+(x<0?.5:-.5),y:3.9,z:z+.8,width:.12,height:1.6,depth:.15,rz:x<0?-40:40,color:'#493727'});
 }
}
fs.mkdirSync('assets/gatehouse/optimized',{recursive:true});
for(const [name,geoms] of zones){const geometry=mergeGeometries(geoms);const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:0}));mesh.name=name;const bin=new Uint8Array(await new GLTFExporter().parseAsync(mesh,{binary:true}));const validation=await validateBytes(bin,{uri:name+'.glb'});if(validation.issues.numErrors)throw Error(JSON.stringify(validation.issues));fs.writeFileSync('assets/gatehouse/optimized/'+name+'.glb',bin);ledger.push({name,triangles:geometry.attributes.position.count/3,instances:name==='door'?80:1,bytes:bin.length,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings});}
const models=[...zones.keys()].filter(n=>n!=='door').map(n=>`<m-model src="/assets/gatehouse/optimized/${n}.glb" collide="false" cast-shadows="false" clickable="false"></m-model>`).join('\n');html=html.replace('<script>',models+'\n<script>');
fs.writeFileSync('examples/swamp-full-course-optimized.html',html);
const lights=Array.from({length:10},(_,i)=>`<m-light type="point" cast-shadows="false" intensity="900" distance="45" y="10" z="${8-i*18}"></m-light>`).join('');
fs.writeFileSync('examples/swamp-full-course-optimized-preview.html',html.replace('<m-group y="0.05">','<m-group y="0.05">'+lights));
const remainingCubes=(html.match(/<m-cube/g)||[]).length,labels=(html.match(/<m-label/g)||[]).length;
const report={removedPrimitiveElements:removed,remainingCubes,labels,modelInstances:90,assets:ledger,authoredTriangles:remainingCubes*12+labels*2+ledger.reduce((s,a)=>s+a.triangles*a.instances,0),nativeValidation:'pending',remoteAssets:'Upload optimized GLBs and replace local URLs before using online editor'};
fs.writeFileSync('builds/swamp-gatehouse-v2/optimization.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));


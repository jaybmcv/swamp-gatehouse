import fs from 'node:fs';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {validateBytes} from 'gltf-validator';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}};
const out='assets/gatehouse/weathered';fs.mkdirSync(out,{recursive:true});
const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([t,data])),8+data.length);return b;}
// Authored procedural surface atlas: wood grain and granular stone. No external imagery.
const size=256,raw=Buffer.alloc((size*3+1)*size);
const noise=(x,y)=>{let n=Math.imul(x+173,374761393)^Math.imul(y+79,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
for(let y=0;y<size;y++)for(let x=0;x<size;x++){
 const wood=x<128,u=x%128;
 const grain=Math.sin(u*.43+Math.sin(y*.038)*.9+Math.sin(y*.012)*2.1);
 const pore=noise(x,y),broad=noise(Math.floor(x/9),Math.floor(y/13));
 let value=wood?216+grain*18+Math.sin(u*1.71+y*.014)*7+(pore-.5)*16:211+(pore-.5)*37+(broad-.5)*25;
 if(wood&&grain<-.96)value-=26;
 value=Math.max(130,Math.min(250,value));
 const offset=y*(size*3+1)+1+x*3;raw[offset]=value;raw[offset+1]=value;raw[offset+2]=value;
}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
fs.writeFileSync(out+'/surface-atlas.png',png);
function unpack(bytes){const n=bytes.readUInt32LE(12);return {j:JSON.parse(bytes.subarray(20,20+n)),bin:Buffer.from(bytes.subarray(28+n))};}
function pack(j,bin){j.buffers=[{byteLength:bin.length}];let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);const h=Buffer.alloc(20),bh=Buffer.alloc(8);h.writeUInt32LE(0x46546c67);h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+bin.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([h,json,bh,bin]);}
function weather(file,isDoor=false){
 const {j,bin:input}=unpack(fs.readFileSync(file));let bin=input;
 const append=b=>{const offset=bin.length;bin=Buffer.concat([bin,b,Buffer.alloc((4-b.length%4)%4)]);return offset;};
 for(const mesh of j.meshes)for(const p of mesh.primitives){
  const pos=j.accessors[p.attributes.POSITION],col=j.accessors[p.attributes.COLOR_0],normal=j.accessors[p.attributes.NORMAL];
  const read=(acc,i,k)=>bin.readFloatLE((j.bufferViews[acc.bufferView].byteOffset||0)+(acc.byteOffset||0)+i*(j.bufferViews[acc.bufferView].byteStride||12)+k*4);
  const oldUV=j.accessors[p.attributes.TEXCOORD_0],uv=Buffer.alloc(pos.count*8);
  for(let i=0;i<pos.count;i++){
   const x=read(pos,i,0),y=read(pos,i,1),z=read(pos,i,2),r=read(col,i,0),g=read(col,i,1),b=read(col,i,2);
   const wood=r>g*1.14,worldY=isDoor?y+1.75:y;
   let u,v;if(oldUV){const view=j.bufferViews[oldUV.bufferView],off=(view.byteOffset||0)+(oldUV.byteOffset||0)+i*(view.byteStride||8);u=bin.readFloatLE(off);v=bin.readFloatLE(off+4);}else{u=((Math.abs(read(normal,i,1))>.7?x:z)*.3%1+1)%1;v=((y*.25)%1+1)%1;}
   uv.writeFloatLE((wood?.008:.508)+u*.484,i*8);uv.writeFloatLE(.008+v*.984,i*8+4);
   const damp=worldY<.9? .74+.26*Math.max(0,worldY)/.9:1;
   let rgb=[r*damp,g*damp,b*damp];
   // Five restrained banner palettes, repeated in a progression through ten rows.
   if(!isDoor&&Math.abs(Math.abs(x)-18.1)<.61&&y>2.95&&y<5.45&&r>g*1.25){const row=Math.max(0,Math.min(9,Math.round(-z/18)));rgb=new T.Color(['#785147','#566b61','#746344','#526275','#75575e'][row%5]).toArray();}
   // Warm paper without emission, new lights or bloom.
   if(!isDoor&&r>.32&&g>.22&&b>.1&&b<g*.8&&y>2.65&&y<3.5&&Math.abs(z+Math.round(-z/18)*18-1.3)<.4)rgb=new T.Color('#bfa06b').toArray();
   const offset=(j.bufferViews[col.bufferView].byteOffset||0)+(col.byteOffset||0)+i*(j.bufferViews[col.bufferView].byteStride||12);
   rgb.forEach((value,k)=>bin.writeFloatLE(value,offset+k*4));
  }
  delete col.min;delete col.max;
  const offset=append(uv),view=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:offset,byteLength:uv.length,target:34962});
  p.attributes.TEXCOORD_0=j.accessors.length;j.accessors.push({bufferView:view,componentType:5126,count:pos.count,type:'VEC2'});
 }
 const imageOffset=append(png);j.bufferViews.push({buffer:0,byteOffset:imageOffset,byteLength:png.length});j.images=[{bufferView:j.bufferViews.length-1,mimeType:'image/png'}];j.samplers=[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}];j.textures=[{source:0,sampler:0}];
 for(const m of j.materials){m.pbrMetallicRoughness.baseColorTexture={index:0};m.pbrMetallicRoughness.roughnessFactor=.96;}
 return {j,bin};
}
// Combine static models into one asset while retaining separate simple PBR meshes.
function combine(parts){const j={asset:{version:'2.0',generator:'Swamp material pass'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],accessors:[],bufferViews:[],images:[],textures:[],samplers:[]};let bin=Buffer.alloc(0);
 for(const part of parts){const a=structuredClone(part.j),base=bin.length,v=j.bufferViews.length,ac=j.accessors.length,m=j.materials.length,im=j.images.length,tex=j.textures.length,sa=j.samplers.length;
  for(const view of a.bufferViews)j.bufferViews.push({...view,buffer:0,byteOffset:(view.byteOffset||0)+base});
  for(const accessor of a.accessors)j.accessors.push({...accessor,bufferView:accessor.bufferView+v});
  for(const image of a.images||[])j.images.push({...image,bufferView:image.bufferView+v});
  j.samplers.push(...a.samplers||[]);for(const t of a.textures||[])j.textures.push({...t,source:t.source+im,sampler:t.sampler+sa});
  for(const mat of a.materials){if(mat.pbrMetallicRoughness.baseColorTexture)mat.pbrMetallicRoughness.baseColorTexture.index+=tex;j.materials.push(mat);}
  for(const mesh of a.meshes){for(const p of mesh.primitives){p.material+=m;for(const key in p.attributes)p.attributes[key]+=ac;if(p.indices!==undefined)p.indices+=ac;}j.scenes[0].nodes.push(j.nodes.length);j.nodes.push({mesh:j.meshes.length});j.meshes.push(mesh);}
  bin=Buffer.concat([bin,part.bin,Buffer.alloc((4-part.bin.length%4)%4)]);
 }return {j,bin};}
// Moss islands, damp perimeter earth, and a geometric finish crest; never colliding.
const shapes=[];
function shape(g,x,y,z,c,rx=0,rz=0){if(g.index)g=g.toNonIndexed();g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,0,rz)),new T.Vector3(1,1,1)));const rgb=new T.Color(c).toArray();g.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:g.attributes.position.count},()=>rgb).flat(),3));g.deleteAttribute('uv');shapes.push(g);}
for(let row=0;row<10;row++)for(const s of [-1,1]){
 const z=-row*18,x=s<0?-17.65:24.85;
 for(let i=0;i<5;i++){const g=new T.SphereGeometry(.42+i*.06,7,4);g.scale(1.7,.2,1.2);shape(g,x+s*.35,-.1,z+(i-2)*1.1,['#45412e','#4c5031','#56603b'][i%3]);}
 for(let p=0;p<9;p++){const xx=-16.8+p*4.2;const g=new T.SphereGeometry(.25,6,4);g.scale(1.5,.65,.12);shape(g,xx,.3+(p%3)*.12,z+.79,['#43563a','#526144','#616b45'][p%3]);}
}
shape(new T.TorusGeometry(1.35,.11,6,32),0,6.7,-173.6,'#a48b50');
shape(new T.BoxGeometry(.9,.9,.12),0,6.7,-173.6,'#c0a266',0,Math.PI/4);
for(const s of [-1,1])for(let i=0;i<5;i++)shape(new T.BoxGeometry(.16,.7,.1),s*(.55+i*.2),5.75+i*.2,-173.55,'#9a834e',0,-s*.6);
const mesh=new T.Mesh(mergeGeometries(shapes),new T.MeshStandardMaterial({vertexColors:true,roughness:1}));
const accents=unpack(Buffer.from(await new GLTFExporter().parseAsync(mesh,{binary:true})));
const door=weather('assets/gatehouse/optimized/door.glb',true);
const staticParts=Array.from({length:10},(_,i)=>weather(`assets/gatehouse/optimized/scenery-${i}.glb`));
staticParts.push(weather('assets/gatehouse/optimized/architecture-v3.glb'),accents);
const scenery=combine(staticParts),ledger=[];
for(const [name,part] of [['door-weathered-v4',door],['scenery-weathered-v4',scenery]]){const bytes=pack(part.j,part.bin),result=await validateBytes(bytes,{uri:name+'.glb'});assert.equal(result.issues.numErrors,0,JSON.stringify(result.issues));fs.writeFileSync(out+'/'+name+'.glb',bytes);ledger.push({name,bytes:bytes.length,errors:result.issues.numErrors,warnings:result.issues.numWarnings});}
for(const suffix of ['', '-preview']){let html=fs.readFileSync(`examples/swamp-full-course-detailed${suffix}.html`,'utf8');html=html.replaceAll('/assets/gatehouse/optimized/door.glb','/assets/gatehouse/weathered/door-weathered-v4.glb');html=html.replace(/<m-model[^>]*src="\/assets\/gatehouse\/optimized\/(?:scenery-\d+|architecture-v3)\.glb"[^>]*><\/m-model>/g,'');html=html.replace('<script>','<m-model id="weathered-scenery" src="/assets/gatehouse/weathered/scenery-weathered-v4.glb" collide="false" cast-shadows="false" clickable="false"></m-model>\n<script>');fs.writeFileSync(`examples/swamp-full-course-weathered${suffix}.html`,html);}
const added=mesh.geometry.attributes.position.count/3,total=168784+added;
fs.writeFileSync('builds/swamp-gatehouse-v2/weather-v4.json',JSON.stringify({assets:ledger,addedTriangles:added,totalAuthoredTriangles:total,texture:'Procedural 256x256 wood/stone atlas; embedded PNG; no emissive lighting',nativeVisualReview:'pending'},null,2));console.log({ledger,added,total});


import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validateBytes} from 'gltf-validator';
const html=fs.readFileSync('examples/swamp-full-course-host-walk.html','utf8');
const models=[...html.matchAll(/<m-model\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
const assets=[];
for(const src of new Set(models)){
 const bytes=fs.readFileSync('.'+src),j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 let triangles=0;function visit(i){const n=j.nodes[i];if(n.mesh!==undefined)for(const p of j.meshes[n.mesh].primitives){assert.equal(p.mode??4,4);triangles+=j.accessors[p.indices??p.attributes.POSITION].count/3;}for(const c of n.children||[])visit(c);}
 for(const n of j.scenes[j.scene??0].nodes)visit(n);
 const result=await validateBytes(new Uint8Array(bytes),{uri:src});assert.equal(result.issues.numErrors,0);
 assets.push({src,placements:models.filter(s=>s===src).length,triangles,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),errors:result.issues.numErrors,warnings:result.issues.numWarnings});
}
const cubeCount=(html.match(/<m-cube\b/g)||[]).length,labelCount=(html.match(/<m-label\b/g)||[]).length;
const triangleInventory=assets.reduce((s,a)=>s+a.triangles*a.placements,0)+cubeCount*12;
const report={assets,cubeCount,labelCount,triangleInventory,scope:'GLB placements plus all MML cubes including invisible proxies; label renderer geometry excluded',historicalLedger:242056};
assert.equal(models.filter(s=>s.includes('door-weathered')).length,80);assert.ok(triangleInventory<1000000);assert.ok(!/value\s*===\s*'\d{4}'/.test(html));assert.ok(html.includes('demo-reset'));
fs.mkdirSync('evidence',{recursive:true});fs.writeFileSync('evidence/asset-audit.json',JSON.stringify(report,null,2));console.log(report);


import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
let time=1000;const nodes={},intervals=[];function node(type){return {type,attrs:{},events:{},setAttribute(k,v){this.attrs[k]=v;if(k==='id')nodes[v]=this},addEventListener(k,f){this.events[k]=f},appendChild(){}}}
const html=fs.readFileSync('examples/swamp-full-course-compact.html','utf8');for(const m of html.split('<script>')[0].matchAll(/<([\w-]+)([^>]*)>/g)){const n=node(m[1]);for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))n.setAttribute(a[1],a[2]);}
const ctx={document:{createElement:node,documentElement:node('root'),getElementById:id=>nodes[id]},Date:{now:()=>time},Math,setInterval:f=>intervals.push(f)};vm.createContext(ctx);vm.runInContext(html.match(/<script>([\s\S]*)<\/script>/)[1],ctx);const d=ctx.doors.find(d=>!d.safe);nodes[d.id+'-pad'].events.collisionstart();time+=175;ctx.tick();console.log({doors:ctx.doors.length,wrong:d.id,y:nodes[d.id].attrs.y,z:nodes[d.id].attrs.z,intervals:intervals.length});

assert.equal(ctx.doors.length,80);assert.equal(Number(nodes[d.id].attrs.y),3.75);assert.equal(Number(nodes[d.id].attrs.z),3.75);console.log('80 doors and contact-driven midpoint motion passed');

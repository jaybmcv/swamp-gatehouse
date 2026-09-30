import fs from 'node:fs';
const root='examples/swamp-full-course-host-walk.html';
const full=fs.readFileSync(root,'utf8');
const builder=fs.readFileSync('scripts/build-host-walkway.mjs','utf8');
const construction=builder.slice(builder.indexOf('const H=9'),builder.indexOf('const additions='));
const bootstrap=`(function(){\n${construction}\nvar parent=document.createElement('m-group');parent.setAttribute('y','0.05');document.documentElement.appendChild(parent);var stack=[parent];parts.forEach(function(markup){var tags=markup.match(/<[^>]+>/g)||[];tags.forEach(function(tag){if(tag.indexOf('</')===0){stack.pop();return;}var type=tag.match(/^<([\\w-]+)/)[1],node=document.createElement(type);var re=/([\\w-]+)="([^"]*)"/g,m;while((m=re.exec(tag)))node.setAttribute(m[1],m[2]);stack[stack.length-1].appendChild(node);stack.push(node);});});\n})();`;
const first=full.indexOf('<m-cube id="host-rail-');
if(first<0)throw Error('host boundary missing');
const script=full.indexOf('<script>',first);
const compact=full.slice(0,first)+'<script>\n//<![CDATA[\n'+bootstrap+'\n'+full.slice(script+8).replace('//<![CDATA[','');
fs.writeFileSync('examples/swamp-full-course-compact.html',compact);
console.log({full:full.length,compact:compact.length});


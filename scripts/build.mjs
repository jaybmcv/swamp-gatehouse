import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
fs.mkdirSync('examples',{recursive:true});
for(const script of ['build-swamp-course','optimize-swamp-course','detail-swamp-course','weather-swamp-course','build-host-walkway','compact-host-course']) execFileSync(process.execPath,['scripts/'+script+'.mjs'],{stdio:'inherit'});

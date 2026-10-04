import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const stableVersion=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function nextVersion(tags, baseline, bump){
 if(!['major','minor','patch'].includes(bump))throw new Error('Expected major, minor or patch');
 const versions=tags.filter(t=>t.startsWith('v') && stableVersion.test(t.slice(1))).map(t=>t.slice(1));
 if(!versions.length)versions.push(baseline);
 if(versions.some(v=>!stableVersion.test(v)))throw new Error('Invalid version');
 const parse=v=>v.split('.').map(BigInt);
 versions.sort((a,b)=>{const aa=parse(a),bb=parse(b);for(let i=0;i<3;i++){if(aa[i]!==bb[i])return aa[i]>bb[i]?1:-1;}return 0;});
 const parts=parse(versions.at(-1));
 const index={major:0,minor:1,patch:2}[bump];
 parts[index]++;
 for(let i=index+1;i<3;i++)parts[i]=0n;
 return parts.join('.');
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv[2]==='validate'){
  if(!stableVersion.test(process.argv[3] || ''))throw new Error('Release version must be X.Y.Z (no leading zeroes)');
 }else{
  const tags=execFileSync('git',['tag','--list','v*'],{encoding:'utf8'}).trim().split('\n');
  console.log(nextVersion(tags,JSON.parse(readFileSync('package.json')).version,process.argv[2]));
 }
}

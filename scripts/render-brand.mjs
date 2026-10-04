// Render existing vector artwork and the licensed Circuit font, no new artwork.
import {chromium} from '@playwright/test';
import {readFile, mkdir} from 'node:fs/promises';
const asset=async(name,type)=>`data:${type};base64,${(await readFile(`src/login/assets/${name}`)).toString('base64')}`;
const browser=await chromium.launch({executablePath:process.env.PSYNET_CHROMIUM_PATH,headless:true});
try{
 const page=await browser.newPage({viewport:{width:720,height:240},deviceScaleFactor:1});
 await page.setContent(`<style>@font-face{font-family:Circuit;src:url('${await asset('PsyNet-Circuit.woff2','font/woff2')}')}body{margin:0;background:transparent}main{width:720px;height:240px;display:flex;align-items:center;justify-content:center;gap:30px;color:white}img{width:180px;height:180px}span{font:94px Circuit;white-space:nowrap}</style><main><img src="${await asset('emblem.svg','image/svg+xml')}"><span>PsyNet</span></main>`);
 await page.evaluate(()=>document.fonts.ready);
 await mkdir('theme-src/brand',{recursive:true});
 await page.screenshot({path:'theme-src/brand/psynet-logo.png',omitBackground:true});
}finally{await browser.close()}

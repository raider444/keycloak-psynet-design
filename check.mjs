import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';

await mkdir('previews', {recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort']);
let browser;
try {
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Vite startup timed out')),20000);
  server.stdout.on('data',d=>{if(d.toString().includes('Local:')){clearTimeout(timeout);resolve();}});
  server.stderr.on('data',d=>process.stderr.write(d));
  server.once('error',e=>{clearTimeout(timeout);reject(e);});
  server.once('exit',code=>{clearTimeout(timeout);reject(new Error(`Vite exited: ${code}`));});
 });
 browser=await chromium.launch({headless:true,executablePath:process.env.PSYNET_CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const mode of ['dark','light']){
  await page.goto(`http://127.0.0.1:5173/?theme=${mode}`);
  await page.evaluate(()=>localStorage.clear());
  await page.reload();
  await page.locator('#username').waitFor();
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.psy-shell').getAttribute('data-appearance'),mode);
  await page.screenshot({path:`previews/${mode}.png`,fullPage:true});
 }
 await page.locator('#password').fill('example-password');
 assert.equal(await page.locator('#password').getAttribute('type'),'password');
 await page.locator('.psy-reveal').click();
 assert.equal(await page.locator('#password').getAttribute('type'),'text');
 await page.locator('.psy-reveal').click();
 assert.equal(await page.locator('#password').getAttribute('type'),'password');
 await page.locator('.psy-toggle').click();
 assert.equal(await page.locator('.psy-shell').getAttribute('data-appearance'),'dark');
 await page.reload();
 await page.locator('#username').waitFor();
 assert.equal(await page.locator('.psy-shell').getAttribute('data-appearance'),'dark');
 for(const [id,input] of [['register.ftl','input[name="email"]'],['login-reset-password.ftl','#username'],['login-otp.ftl','#otp']]){
  await page.goto(`http://127.0.0.1:5173/?page=${id}&lang=ru`);
  await page.locator(input).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`previews/${id}.png`,fullPage:true});
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:5173/?lang=el');
 await page.locator('#username').waitFor();
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'previews/mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[],'Unexpected browser exceptions');
 console.log('PASS theme defaults/toggle/persistence, password visibility, registration/reset/OTP fields, mobile width, no browser exceptions');
} finally {
 await browser?.close();
 server.kill('SIGTERM');
}

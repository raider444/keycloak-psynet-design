// Disposable local Keycloak + SMTP sink. Never connects to a user's realm.
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '@playwright/test';

const images={
 '26.0.8':'quay.io/keycloak/keycloak:26.0.8@sha256:09a381c715ab0b111835b70f2905955274843a219c6f27efb348e4d9f4086858',
 '26.8.0':'quay.io/keycloak/keycloak:26.8.0@sha256:b0f60d489d51c5d113390bdf5461d4c06e6051be026c05549f2e1e10ec352bcc',
};
const version=process.env.PSYNET_KEYCLOAK_VERSION || '26.8.0';
assert(images[version],`Unsupported test version: ${version}`);
const mailImage='axllent/mailpit:v1.31.4@sha256:b68349e3a014b90c5610bfb26b2ae36f3892d7b8cf25ee140c6c71c98d2fcf48';
const id=`psynet-check-${randomBytes(5).toString('hex')}`;
const password=randomBytes(24).toString('hex');
const docker=(...args)=>execFileSync('docker',args,{encoding:'utf8',maxBuffer:8*1024*1024}).trim();
const previewDir=`previews/keycloak-${version}`;
let browser;
let activePage;
const port=name=>docker('port',name,'8080/tcp').split(':').at(-1);
async function waitFor(url){
 for(let i=0;i<180;i++){
  try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return;}catch{}
  await delay(1000);
 }
 throw new Error(`Timed out waiting for ${url}`);
}
try{
 await mkdir(previewDir,{recursive:true});
 docker('network','create',id);
 docker('run','-d','--name',`${id}-mail`,'--network',id,'--network-alias','mail',
  '-p','127.0.0.1::8025',mailImage);
 docker('run','-d','--name',id,'--network',id,'-p','127.0.0.1::8080',
  '-e','KC_BOOTSTRAP_ADMIN_USERNAME=admin','-e',`KC_BOOTSTRAP_ADMIN_PASSWORD=${password}`,
  '-v',`${resolve('dist_keycloak/psynet-keycloak-26.jar')}:/opt/keycloak/providers/psynet-keycloak-26.jar:ro`,
  images[version],'start-dev','--spi-theme--static-max-age=-1','--spi-theme--cache-themes=false','--spi-theme--cache-templates=false');
 const base=`http://127.0.0.1:${port(id)}`;
 const mailBase=`http://127.0.0.1:${docker('port',`${id}-mail`,'8025/tcp').split(':').at(-1)}`;
 await waitFor(`${base}/realms/master`);
 const tokenResponse=await fetch(`${base}/realms/master/protocol/openid-connect/token`,{method:'POST',body:new URLSearchParams({client_id:'admin-cli',grant_type:'password',username:'admin',password})});
 assert.equal(tokenResponse.status,200);
 const {access_token:token}=await tokenResponse.json();
 async function api(path,method='GET',body){
  const response=await fetch(`${base}/admin/${path}`,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok)throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  const text=await response.text();
  return text?JSON.parse(text):null;
 }
 const info=await api('serverinfo');
 for(const kind of ['login','account','admin','email']){
  for(const name of ['psynet-light','psynet-dark'])assert(info.themes[kind].some(t=>t.name===name),`${kind}/${name} not discovered`);
 }
 browser=await chromium.launch({headless:true,executablePath:process.env.PSYNET_CHROMIUM_PATH,args:['--no-sandbox']});
 for(const scheme of ['light','dark']){
  const realm=`psynet-${scheme}`;
  await api('realms','POST',{realm,enabled:true,displayName:'PsyNet & Forest',loginTheme:realm,accountTheme:realm,adminTheme:realm,emailTheme:realm,
   resetPasswordAllowed:true,internationalizationEnabled:true,supportedLocales:['en','ru','el'],defaultLocale:'en',
   smtpServer:{host:'mail',port:'1025',from:'noreply@psynet.test',ssl:'false',starttls:'false',auth:'false'}});
  // Create after realm initialization so Keycloak assigns default account roles.
  await api(`realms/${realm}/users`,'POST',{username:'tester',email:`${scheme}@psynet.test`,emailVerified:true,enabled:true,firstName:'Forest',lastName:'Explorer',credentials:[{type:'password',value:password,temporary:false}]});
  const [user]=await api(`realms/${realm}/users?username=tester`);

  const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:scheme==='dark'?'light':'dark'});
  const page=await context.newPage();activePage=page;
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')console.error('Browser:',m.text(),m.location().url);});
  page.on('response',r=>{if(r.status()>=400)console.error('HTTP',r.status(),new URL(r.url()).pathname,'authenticated:',Boolean(r.request().headers().authorization));});
  await page.goto(`${base}/realms/${realm}/account/`);
  await page.locator('#username').fill('tester');
  await page.locator('#password').fill(password);
  await page.locator('#kc-login').click();
  await page.waitForURL(`**/realms/${realm}/account/**`);
  await page.getByRole('textbox',{name:'First name',exact:true}).waitFor();
  await page.waitForFunction(s=>document.documentElement.dataset.psynetAppearance===s,scheme);
  assert.equal(await page.locator('body').evaluate(e=>getComputedStyle(e).color),scheme==='dark'?'rgb(244, 246, 251)':'rgb(32, 39, 57)');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await page.screenshot({path:`${previewDir}/account-${scheme}.png`,fullPage:true});
  await page.getByRole('textbox',{name:'First name',exact:true}).fill('PsyNet');
  const saved=page.waitForResponse(r=>r.url().includes(`/realms/${realm}/account/`) && r.request().method()==='POST');
  await page.getByRole('button',{name:'Save',exact:true}).click();
  assert((await saved).ok(),'Account save failed');
  await page.reload();
  await page.getByRole('textbox',{name:'First name',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'First name',exact:true}).inputValue(),'PsyNet');
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
  await page.screenshot({path:`${previewDir}/account-${scheme}-mobile.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'account overflows mobile');
  assert.deepEqual(errors,[]);
  await context.close();

  await api('realms/master','PUT',{adminTheme:realm});
  const adminContext=await browser.newContext({viewport:{width:1440,height:1000}});
  const adminPage=await adminContext.newPage();activePage=adminPage;
  const adminErrors=[];adminPage.on('pageerror',e=>adminErrors.push(e.message));
  await adminPage.goto(`${base}/admin/master/console/#/${realm}/realm-settings`);
  await adminPage.locator('#username').fill('admin');
  await adminPage.locator('#password').fill(password);
  await adminPage.locator('#kc-login').click();
  await adminPage.getByRole('tab',{name:'Themes',exact:true}).waitFor();
  await adminPage.waitForFunction(s=>document.documentElement.dataset.psynetAppearance===s,scheme);
  await adminPage.getByRole('tab',{name:'Themes',exact:true}).click();
  await adminPage.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  await adminPage.screenshot({path:`${previewDir}/admin-${scheme}.png`,fullPage:true});
  await adminPage.setViewportSize({width:390,height:844});
  await adminPage.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
  await adminPage.screenshot({path:`${previewDir}/admin-${scheme}-mobile.png`,fullPage:true});
  assert.deepEqual(adminErrors,[]);
  await adminContext.close();

  // Exercise native multipart email rendering through the installed provider.
  for(const operation of ['execute-actions-email','send-verify-email','password-reset']){
   await fetch(`${mailBase}/api/v1/messages`,{method:'DELETE'});
   if(operation==='password-reset'){
    const resetContext=await browser.newContext();
    const resetPage=await resetContext.newPage();
    await resetPage.goto(`${base}/realms/${realm}/account/`);
    await resetPage.getByRole('link',{name:'Forgot Password?'}).click();
    await resetPage.locator('#username').fill('tester');
    const sent=resetPage.waitForResponse(r=>r.url().includes('/login-actions/reset-credentials') && r.request().method()==='POST');
    await resetPage.locator('input[type=submit],button[type=submit]').click();
    assert((await sent).ok());
    await resetContext.close();
   }else{
    await api(`realms/${realm}/users/${user.id}/${operation}`,'PUT',operation==='execute-actions-email'?['UPDATE_PASSWORD']:undefined);
   }
   let messages;
   for(let attempt=0;attempt<30;attempt++){
    messages=await (await fetch(`${mailBase}/api/v1/messages`)).json();
    if(messages.messages?.length)break;
    await delay(200);
   }
   assert(messages.messages?.length,'No email received');
   const message=await (await fetch(`${mailBase}/api/v1/message/${messages.messages[0].ID}`)).json();
   assert(message.HTML.includes('PsyNet') && message.Text.includes('PsyNet'),'Missing HTML or text part');
   assert(message.HTML.includes('role="presentation"'),'Missing table email layout');
   assert(!/<script\b|<iframe\b|display:\s*(grid|flex)/i.test(message.HTML));
   const links=[...message.Text.matchAll(/https?:\/\/[^\s<>]+/g)].map(m=>m[0]);
   assert(links.some(link=>link.includes('/login-actions/action-token?')),'Missing native action URL');
   for(const link of links)assert(message.HTML.includes(link.replaceAll('&','&amp;')) || message.HTML.includes(link),'HTML/text action URL mismatch');
   const emailPage=await browser.newPage({viewport:{width:680,height:900}});
   await emailPage.setContent(message.HTML);
   await emailPage.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
   await emailPage.screenshot({path:`${previewDir}/email-${scheme}-${operation}.png`,fullPage:true});
   await emailPage.setViewportSize({width:390,height:844});
   await emailPage.screenshot({path:`${previewDir}/email-${scheme}-${operation}-mobile.png`,fullPage:true});
   assert.equal(await emailPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'email overflows mobile');
   await emailPage.close();
  }
 }
 console.log(`PASS Keycloak ${version}: theme discovery, native login/account save, admin consoles, multipart SMTP and mobile layouts`);
}catch(error){
 try{await activePage?.screenshot({path:`${previewDir}/failure.png`,fullPage:true});console.error(await activePage?.locator('body').innerText());console.error(await activePage?.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width}))));}catch{}
 try{await writeFile(`${previewDir}/server.log`,docker('logs',id));}catch{}
 throw error;
}finally{
 await browser?.close();
 for(const container of [id,`${id}-mail`]){try{docker('rm','-f',container);}catch{}}
 try{docker('network','rm',id);}catch{}
}

import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

// Runs against a local build with the custom API mocked. No real email or data writes.
const root = resolve('dist');
const artifacts = resolve('tests/artifacts');
await mkdir(artifacts, { recursive: true });
let role = 'admin';let loggedIn=false;let mustChangePassword=false;let failWrites=false;let storedRecords=[];
const userId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const user=()=>({id:userId,name:'Browser test account',username:'browser_test',email:'browser-test@example.invalid',mobile:'',role,status:'active',assigned_records:role==='operator'?2:0,completed_records:0,pending_records:0,expiry_date:null,first_login:null,expiry_days:0,created_at:new Date().toISOString()});
const server = createServer(async (req, res) => {
 try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
     const chunks=[];for await(const chunk of req)chunks.push(chunk);
     const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
     const reply=(status,payload,headers={})=>{res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(payload));};
     if(url.pathname==='/api/auth/login'&&req.method==='POST') {loggedIn=true;reply(200,{user:user(),mustChangePassword,passwordExpiresAt:new Date(Date.now()+86400000).toISOString()},{'Set-Cookie':'matrientry_session=browser-test; Path=/; HttpOnly; SameSite=Strict'});return;}
     if(url.pathname==='/api/auth/session'&&req.method==='GET') {if(!loggedIn){reply(401,{error:'Please sign in.'});return;}reply(200,{user:user(),mustChangePassword,passwordExpiresAt:new Date(Date.now()+86400000).toISOString()});return;}
     if(url.pathname==='/api/auth/logout'&&req.method==='POST') {loggedIn=false;reply(200,{success:true},{'Set-Cookie':'matrientry_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'});return;}
     if(url.pathname==='/api/auth/change-password'&&req.method==='POST') {mustChangePassword=false;loggedIn=false;reply(200,{success:true});return;}
     if(!loggedIn){reply(401,{error:'Please sign in.'});return;}
     if(url.pathname==='/api/workspace'&&req.method==='GET') {reply(200,{user:user(),users:[user()],records:storedRecords,logs:[]});return;}
     if(url.pathname==='/api/records'&&req.method==='PUT') {
        if(failWrites){reply(503,{error:'Test save unavailable'});return;}
        const row={...body,id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',operator_id:userId,slot_number:body.slotNumber,submitted_by_name:user().name,submitted_by_username:user().username,created_at:new Date().toISOString(),last_updated_on:new Date().toISOString(),submitted_at:body.status==='Submitted'?new Date().toISOString():null};
        const snake=Object.fromEntries(Object.entries(row).map(([key,value])=>[key.replace(/[A-Z]/g,c=>`_${c.toLowerCase()}`),value]));storedRecords=[snake];reply(200,{record:snake});return;
     }
     if(url.pathname.startsWith('/api/records/')&&req.method==='DELETE') {storedRecords=[];reply(200,{success:true});return;}
     reply(404,{error:'Not found'});return;
    }
    const path = resolve(root, '.' + url.pathname);
  if (!path.startsWith(root)) {res.writeHead(403).end();return;}
  const file = extname(path) ? path : join(root, 'index.html');
  res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[extname(file)] || 'application/octet-stream');
  res.end(await readFile(file));
 } catch {res.writeHead(404).end();}
});
await new Promise(r => server.listen(4179,'127.0.0.1',r));
const profileDir = await mkdtemp(join(tmpdir(),'matrientry-ui-'));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions','--remote-debugging-port=9337',`--user-data-dir=${profileDir}`,'about:blank'], {windowsHide:true,stdio:'ignore'});
const delay = ms => new Promise(r => setTimeout(r,ms));
let socket;
try {
 let tabs;
 for(let n=0;n<40;n++){try {tabs=await (await fetch('http://127.0.0.1:9337/json')).json();break;}catch{await delay(150);}}
 assert.ok(tabs,'Chrome debugging endpoint unavailable');
 socket = new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
 let sequence=0;const pending=new Map();const errors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
socket.onmessage=e=>{
  const message=JSON.parse(e.data);
  if(message.id){const p=pending.get(message.id);pending.delete(message.id);if(message.error)p?.reject(message.error);else p?.resolve(message.result);return;}
  if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
 };
 await send('Network.enable');await send('Runtime.enable');await send('Page.enable');
 const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);return result.result.value;};
 const clickLabel=async label=>evaluate(`document.querySelector(${JSON.stringify(`[aria-label="${label}"]`)}).click()`);
 const wait=async expression=>{for(let i=0;i<80;i++){try{if(await evaluate(expression))return;}catch{}await delay(100);}throw new Error('Timed out: '+expression+' Body: '+await evaluate('document.body?.innerText || ""')+' Errors: '+JSON.stringify(errors));};
 const click=async text=>{assert.ok(await evaluate(`(()=>{const el=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!el)return false;el.click();return true})()`),'Missing button '+text);};
 const shot=async name=>{const {data}=await send('Page.captureScreenshot',{format:'png'});const {writeFile}=await import('node:fs/promises');await writeFile(join(artifacts,name+'.png'),Buffer.from(data,'base64'));};
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:4179'});
 await wait('!!document.querySelector("#login-username")');
 assert.equal(await evaluate('document.body.innerText.includes("Admin Portal")'),false);
 await shot('login-desktop');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate('document.documentElement.scrollWidth <= 390'),'Mobile login overflows');
 await shot('login-mobile');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 const fill = async (id,value) => evaluate(`(()=>{const input=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await fill('login-username','browser_test');await fill('login-password','BrowserPassword!123');await click('Sign in');await wait('!!document.querySelector("#main-content")');
 await wait('location.pathname === "/admin/dashboard"');
 assert.equal(await evaluate('document.body.innerText.includes("Switch to")'),false);
 await click('User Management');await wait('location.pathname === "/admin/users"');
 assert.ok(await evaluate('!!document.querySelector("#main-content") && !!document.querySelector("[aria-current=page]")'),'Route change replaced the authenticated shell');
 await evaluate('history.back()');await wait('location.pathname === "/admin/dashboard"');
 await shot('dashboard-desktop');
 await clickLabel('Workspace settings');
 await wait('!!document.querySelector("dialog[open]")');
 await evaluate(`(()=>{const select=document.querySelector('dialog select');select.value='wide';select.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('input[value="plum"]').click()})()`);
 await click('Save preferences');
 await wait('document.documentElement.dataset.width === "wide" && document.documentElement.dataset.palette === "plum"');
 await send('Page.reload');await wait('document.documentElement.dataset.palette === "plum"');
 await clickLabel('Workspace settings');
 await wait('!!document.querySelector("dialog[open]")');await shot('settings');
 await clickLabel('Close settings');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.ok(await evaluate('document.documentElement.scrollWidth <= 390'),'Mobile dashboard overflows');
 await shot('dashboard-mobile');
 await clickLabel('Open navigation menu');
 await wait(`!!document.querySelector('[aria-label="Close navigation menu"]')`);
 await clickLabel('Close navigation menu');
 role='operator';await send('Page.reload');await wait('document.body.innerText.includes("Continue data entry")');
 assert.equal(await evaluate(`!!document.querySelector('[aria-label="Workspace settings"]')`),false);
 await click('Continue data entry');await wait('document.body.innerText.includes("GENERAL INFORMATION")');
 assert.ok(await evaluate('[...document.querySelectorAll("form input[type=text]")].every(i=>i.value === "")'),'New form contains preset personal data');
 assert.ok(await evaluate('document.documentElement.scrollWidth <= 390'),'Mobile entry form overflows');
 await shot('entry-mobile');
 failWrites=true;
 await click('Save as Draft');await wait('document.body.innerText.includes("Save failed")');
 assert.ok(await evaluate('!!document.querySelector("form")'),'Failed save closed the form');
 failWrites=false;
 await click('Save as Draft');await wait('document.body.innerText.includes("Draft saved")');
 await clickLabel('Open navigation menu');
 await click('Sign Out');await wait('!!document.querySelector("#login-username")');
 assert.equal(await evaluate('!!document.querySelector("#main-content")'),false);
 mustChangePassword=true;
 await fill('login-username','browser_test');await fill('login-password','TemporaryPassword!123');await click('Sign in');
 await wait('!!document.querySelector("#new-password")');
 assert.equal(await evaluate('!!document.querySelector("#main-content")'),false,'Temporary password unlocked records');
 await fill('current-password','TemporaryPassword!123');await fill('new-password','NewPassword!12345');await fill('confirm-password','MismatchPassword!123');
 await click('Save new password');await wait('document.body.innerText.includes("do not match")');
 await fill('confirm-password','NewPassword!12345');await click('Save new password');
 await wait('document.body.innerText.includes("Your password is ready")');await click('Continue to sign in');
 await wait('!!document.querySelector("#login-password")');
 assert.deepEqual(errors,[],'Browser runtime errors');
 console.log('Browser checks passed: login, admin, settings persistence, mobile navigation, operator access, blank entry form, responsive layouts.');
} finally {
 socket?.close();chrome.kill();await new Promise(r=>server.close(r));
}

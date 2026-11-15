import vm from 'node:vm';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
const html=fs.readFileSync(root+'/recrutement.html','utf8');
const catalog=JSON.parse(fs.readFileSync(root+'/recruitment/catalog.json','utf8'));
const source=fs.readFileSync(root+'/js/recruitment.js','utf8');
const translations=fs.readFileSync(root+'/js/recruitment-i18n.js','utf8');
class Node {
 constructor(tag='div',attrs={}) { this.tag=tag;this.attrs={...attrs};this.id=attrs.id;this.name=attrs.name||'';this.type=attrs.type||'';this.value=attrs.value||'';this.disabled='disabled'in attrs;this.hidden='hidden'in attrs;this.checked=false;this.files=[];this.dataset={};this.listeners={};this.children=[];this.textContent='';this.nodes={};const classes=new Set();this.classList={toggle:(key,on)=>on?classes.add(key):classes.delete(key)}; }
 addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
 async fire(name,event={}){for(const fn of this.listeners[name]||[])await fn({preventDefault(){},target:this,currentTarget:this,...event});}
 append(...nodes){for(const node of nodes){if(node.tag==='fragment')this.children.push(...node.children);else this.children.push(node);}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);if(this.tag==='select')this.value=this.children[0]?.value||'';}
 get childElementCount(){return this.children.length;}
 setAttribute(k,v){this.attrs[k]=String(v);}
 removeAttribute(k){delete this.attrs[k];}
 getAttribute(k){return this.attrs[k]??null;}
 querySelector(selector){if(selector.startsWith('label'))return {textContent:selector};return this.nodes[selector]??=(new Node(selector));}
 focus(){this.focused=true;}
 scrollIntoView(){}
}
function setup(){
 const nodes=new Map();for(const match of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs={};for(const attr of match[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attrs[attr[1]]=attr[2]??'';if(attrs.id)nodes.set(attrs.id,new Node(match[1],attrs));}
 const form=nodes.get('application-form');const fields=[...nodes.values()].filter(n=>n.name&&['input','select','textarea'].includes(n.tag));form.querySelectorAll=()=>fields;
 const doc={listeners:{},getElementById:id=>nodes.get(id),querySelectorAll:()=>[],createElement:tag=>new Node(tag),createDocumentFragment:()=>new Node('fragment'),addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);},async fire(name){for(const fn of this.listeners[name]||[])await fn();}};
 const I18N={lang:'fr',en:{},extend(data){Object.assign(this.en,data);},t(key,fallback){return this.lang==='en'&&this.en[key]!==undefined?this.en[key]:fallback;}};
 let mode='pending',posts=0,lastPayload;
 class BrowserFormData extends FormData {constructor(input){super();for(const f of fields){if(f.disabled||!f.name)continue;if(f.type==='file'){for(const file of f.files)this.append(f.name,file,file.name);}else if(f.type!=='checkbox'||f.checked)this.append(f.name,f.value);}}}
 const context=vm.createContext({document:doc,window:{I18N,crypto:webcrypto},I18N,crypto:webcrypto,console,Uint8Array,FormData:BrowserFormData,AbortController,TypeError,setTimeout,clearTimeout,fetch:async(url,opts)=>{if(String(url).includes('catalog.json'))return {ok:true,json:async()=>catalog};posts++;lastPayload=opts.body;if(mode==='503')return {ok:false,status:503,json:async()=>({error:{code:'MAIL_NOT_CONFIGURED',message:'SMTP absent'}})};return {ok:true,status:202,json:async()=>({data:{reference:'CP-TEST-001',emailStatus:'pending',receivedAt:'2026-11-15T12:00:00Z'}})};}});
 vm.runInContext(translations,context);vm.runInContext(source,context);
 return {nodes,doc,form,I18N,get posts(){return posts;},get payload(){return lastPayload;},set mode(v){mode=v;}};
}
async function ready(state){await state.doc.fire('DOMContentLoaded');await new Promise(r=>setImmediate(r));}
async function choose(state){const n=id=>state.nodes.get(id);n('job-country').value='CD';await n('job-country').fire('change');n('job-province').value='kinshasa';await n('job-province').fire('change');n('job-position').value='agent-commercial';await n('job-position').fire('change');}
function fill(state){const n=id=>state.nodes.get(id);n('app-last-name').value='Test';n('app-first-name').value='Candidate';n('app-email').value='test@example.invalid';n('app-phone').value='+243 812345678';n('app-message').value='Mon expérience et mes motivations pour ce poste.';n('app-consent').checked=true;n('app-cv').files=[new File(['%PDF-1.4\nTest only'],'cv.pdf',{type:'application/pdf'})];}
test('form simulation preserves selections and PDF across language change, handles pending/503 and retries safely', async()=>{
const first=setup();await ready(first);assert.equal(first.nodes.get('job-country').children.length,55);assert.equal(first.nodes.get('job-province').disabled,true);await choose(first);fill(first);
const selectedFile=first.nodes.get('app-cv').files[0];first.I18N.lang='en';await first.doc.fire('langchange');assert.equal(first.nodes.get('job-country').value,'CD');assert.equal(first.nodes.get('job-province').value,'kinshasa');assert.equal(first.nodes.get('job-position').value,'agent-commercial');assert.equal(first.nodes.get('app-first-name').value,'Candidate');assert.equal(first.nodes.get('app-cv').files[0],selectedFile);assert.match(first.nodes.get('position-card-title').textContent,/Sales/i);
await first.form.fire('submit');assert.equal(first.posts,1);assert.equal(first.form.hidden,true);assert.equal(first.nodes.get('application-result').hidden,false);assert.match(first.nodes.get('result-message').textContent,/pending/);assert.equal(first.payload.get('countryCode'),'CD');assert.equal(first.payload.get('cv').name,'cv.pdf');assert.match(first.payload.get('idempotencyKey'),/^[0-9a-f-]{36}$/);
const second=setup();await ready(second);await choose(second);fill(second);second.mode='503';await second.form.fire('submit');assert.equal(second.form.hidden,false);assert.equal(second.nodes.get('app-first-name').value,'Candidate');assert.equal(second.nodes.get('app-cv').files.length,1);assert.match(second.nodes.get('form-error-message').textContent,/pas encore disponible/);const key=second.payload.get('idempotencyKey');await second.form.fire('submit');assert.equal(second.payload.get('idempotencyKey'),key);
const third=setup();await ready(third);await choose(third);fill(third);third.nodes.get('app-email').value='invalid';await third.form.fire('submit');assert.equal(third.posts,0);assert.equal(third.nodes.get('app-email').getAttribute('aria-invalid'),'true');
const fourth=setup();await ready(fourth);fourth.nodes.get('job-country').value='AO';await fourth.nodes.get('job-country').fire('change');assert.equal(fourth.nodes.get('job-province').disabled,true);assert.equal(fourth.nodes.get('application-submit').disabled,true);assert.match(fourth.nodes.get('location-status').textContent,/pas encore ouvert/);
});

'use strict';
// Offline behavior checks. DOM stubs cover interaction/state; browser layout and HTML parsing need separate review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '..', 'js', name + '.js'), 'utf8');
class Element {
    constructor(doc) { this.doc = doc; this.listeners = {}; this.nodes = {}; this.dataset = {}; this.attrs = {}; this.children = []; this.hidden = false; this.disabled = false; this.value = ''; this.checked = false; this.isConnected = true; this.style = {}; this.textContent = ''; this.classes = new Set(); this.classList = { toggle: (key, on) => on ? this.classes.add(key) : this.classes.delete(key) }; }
    addEventListener(key, fn) { (this.listeners[key] ||= []).push(fn); }
    async fire(key, event = {}) { for (const fn of this.listeners[key] || []) await fn({ target: this, preventDefault() {}, ...event }); }
    querySelector(selector) { return this.nodes[selector] || null; }
    querySelectorAll(selector) { return this.many && this.many[selector] || []; }
    setAttribute(key, value) { this.attrs[key] = String(value); }
    getAttribute(key) { return this.attrs[key] || null; }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    focus() { this.doc.activeElement = this; }
    contains(node) { return node === this || (this.members || []).includes(node); }
    checkValidity() { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value); }
    closest() { return null; }
}
function fixture({ pageAction, hash = '', search = '', storage = {}, publication = false, latest = false, response = { ok: true }, status = 200 } = {}) {
    const doc = { readyState: 'complete', documentElement: { lang: 'fr' }, listeners: {}, nodes: {}, hidden: false };
    doc.addEventListener = (key, fn) => (doc.listeners[key] ||= []).push(fn);
    doc.fire = async (key, event) => { for (const fn of doc.listeners[key] || []) await fn(event); };
    doc.querySelector = selector => doc.nodes[selector] || null; doc.querySelectorAll = () => [];
    const el = () => new Element(doc); doc.body = el(); doc.body.style.overflow = 'auto';
    const trigger = el(); trigger.focus();
    function form() {
        const result = el(), submit = el(), message = el(); message.hidden = true;
        result.elements = { email: el(), consent: el(), website: el() };
        result.nodes = { 'button[type="submit"]': submit, '[data-newsletter-status]': message };
        result.reset = () => { result.elements.email.value = ''; result.elements.consent.checked = false; };
        return result;
    }
    const modal = el(), modalForm = form(), close = el(), later = el(); modal.hidden = true;
    modal.nodes = { form: modalForm, 'input[type="email"]': modalForm.elements.email };
    modal.members = [close, modalForm.elements.email, modalForm.elements.consent, modalForm.nodes['button[type="submit"]'], later];
    modal.many = { 'button:not([disabled]), input:not([tabindex="-1"]):not([disabled]), a[href]': modal.members };
    let first = true;
    doc.createElement = () => { const node = el(); if (!publication && first) { node.firstElementChild = modal; first = false; } return node; };
    const root = el(), pageForm = form(), action = el(), actionButton = el(), actionMessage = el(); action.hidden = true;
    root.nodes = { form: pageForm, '[data-newsletter-action]': action };
    action.nodes = { button: actionButton, '[data-newsletter-action-status]': actionMessage, '[data-newsletter-action-title]': el(), '[data-newsletter-action-description]': el() };
    if (pageAction) doc.nodes['[data-newsletter-page]'] = root;
    const recent = el(), recentStatus = el();
    if (latest) { doc.nodes['[data-latest-publication]'] = recent; doc.nodes['[data-latest-status]'] = recentStatus; }
    const location = new URL('https://www.cashpay-all.com/' + (pageAction ? 'newsletter.html?action=' + pageAction : 'index.html') + search + hash);
    const history = []; const requests = []; const timers = [];
    const window = { location, history: { replaceState: (_, __, url) => history.push(url) } };
    const context = { window, document: doc, URL, URLSearchParams, AbortController, Date, Intl, console,
        localStorage: { getItem: key => storage[key] || null, setItem: (key, value) => { storage[key] = value; }, removeItem: key => { delete storage[key]; } },
        setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout() {},
        fetch: async (url, options) => { requests.push({ url, options }); return { ok: status < 400, status, json: async () => response }; } };
    vm.runInNewContext(source(publication ? 'publications' : 'newsletter'), context);
    return { doc, window, trigger, modal, modalForm, pageForm, actionButton, actionMessage, storage, requests, timers, history, recent, recentStatus };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('consent gates requests and subscription acceptance asks for email confirmation', async () => {
    const p = fixture(); const f = p.modalForm;
    f.elements.email.value = 'reader@example.invalid';
    await f.fire('submit'); assert.equal(p.requests.length, 0); assert.match(f.nodes['[data-newsletter-status]'].textContent, /acceptez/);
    f.elements.consent.checked = true; await f.fire('submit');
    assert.equal(p.requests.length, 1); const request = p.requests[0];
    assert.equal(request.url, 'https://app.cashpay-all.com/api/main/newsletter/subscribe');
    assert.equal(request.options.credentials, 'omit'); assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { email: 'reader@example.invalid', language: 'fr', consent: true, website: '', startedAt: JSON.parse(request.options.body).startedAt });
    assert.match(f.nodes['[data-newsletter-status]'].textContent, /confirmer votre inscription/);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined); assert.ok(p.storage['cashpay-newsletter-closed']);
});
test('modal traps focus, Escape returns focus, dismissal suppresses automatic reopening', async () => {
    const p = fixture(); assert.ok(p.timers.some(t => t.ms === 6000)); p.window.CashPayNewsletter.open(p.trigger);
    assert.equal(p.modal.hidden, false); assert.equal(p.doc.activeElement, p.modalForm.elements.email); assert.equal(p.doc.body.style.overflow, 'hidden');
    p.modal.members.at(-1).focus(); let prevented = false;
    await p.doc.fire('keydown', { key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.equal(p.doc.activeElement, p.modal.members[0]);
    await p.doc.fire('keydown', { key: 'Escape', preventDefault() {} });
    assert.equal(p.modal.hidden, true); assert.equal(p.doc.activeElement, p.trigger); assert.equal(p.doc.body.style.overflow, 'auto');
    const next = fixture({ storage: p.storage }); assert.equal(next.timers.some(t => t.ms === 6000), false);
    next.window.CashPayNewsletter.open(next.trigger); assert.equal(next.modal.hidden, false);
});
test('confirmation tokens are removed from URL before a deliberate action and only confirmed subscriptions persist', async () => {
    const token = 'opaque_confirmation_token_1234567890'; const p = fixture({ pageAction: 'confirm', hash: '#' + token });
    assert.equal(p.requests.length, 0); assert.deepEqual(p.history, ['/newsletter.html?action=confirm']);
    await p.actionButton.fire('click'); assert.equal(p.requests.length, 1);
    assert.equal(p.requests[0].url, 'https://app.cashpay-all.com/api/main/newsletter/confirm');
    assert.deepEqual(JSON.parse(p.requests[0].options.body), { token }); assert.equal(p.storage['cashpay-newsletter-subscribed'], '1');
    assert.match(p.actionMessage.textContent, /confirmée/); assert.equal(p.actionButton.hidden, true);
    const bad = fixture({ pageAction: 'confirm', hash: '#short' });
    assert.equal(bad.actionButton.hidden, true); assert.equal(bad.requests.length, 0); assert.match(bad.actionMessage.textContent, /invalide/);
});
test('failed subscription keeps the address and permits retry without claiming confirmation', async () => {
    const p = fixture({ response: { ok: false }, status: 429 }), f = p.modalForm;
    f.elements.email.value = 'reader@example.invalid'; f.elements.consent.checked = true; await f.fire('submit');
    assert.equal(f.elements.email.value, 'reader@example.invalid'); assert.equal(f.nodes['button[type="submit"]'].disabled, false);
    assert.match(f.nodes['[data-newsletter-status]'].textContent, /Trop de demandes/); assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined);
});
test('homepage requests one latest publication and renders one card even if the API returns excess rows', async () => {
    const p = fixture({ publication: true, latest: true, response: { ok: true, articles: [{ id: '1', slug: 'newest', title: '<img onerror=alert(1)>', excerpt: 'News' }, { id: '2', title: 'Older' }], total: 2 } });
    await flush(); assert.equal(p.requests.length, 1); assert.match(p.requests[0].url, /\/articles\?limit=1&offset=0$/);
    assert.equal(p.recent.children.length, 1); assert.equal(p.recent.children[0].href, 'article.html?slug=newest');
    assert.equal(p.recent.children[0].children[0].children[1].textContent, '<img onerror=alert(1)>');
    const safe = p.window.CashPayPublications.safeURL;
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://user:pass@example.com/a', 'http://external.invalid/a']) assert.equal(safe(url), '');
    assert.equal(safe('https://cdn.example.invalid/a.png'), 'https://cdn.example.invalid/a.png');
});

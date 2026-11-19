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
    contains(node) { for (let item = node; item; item = item.parentElement) if (item === this) return true; return node === this || (this.members || []).includes(node); }
    checkValidity() { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value); }
    closest(selector) { if (selector === '[hidden]') { for (let item = this; item; item = item.parentElement) if (item.hidden) return item; } return null; }
}
function fixture({ pageAction, hash = '', search = '', storage = {}, publication = false, latest = false, response = { ok: true }, status = 200, responses = [], hidden = false, prerendering = false } = {}) {
    const doc = { readyState: 'complete', documentElement: { lang: 'fr' }, listeners: {}, nodes: {}, hidden, prerendering };
    doc.addEventListener = (key, fn) => (doc.listeners[key] ||= []).push(fn);
    doc.removeEventListener = (key, fn) => { doc.listeners[key] = (doc.listeners[key] || []).filter(listener => listener !== fn); };
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
    const modal = el(), modalForm = form(), close = el(), later = el(), formView = el(), notice = el(), noticeTitle = el(), noticeMessage = el(), noticeButton = el();
    modal.hidden = true; notice.hidden = true;
    formView.parentElement = modal; modalForm.parentElement = formView; close.parentElement = modal; later.parentElement = formView;
    for (const control of [...Object.values(modalForm.elements), modalForm.nodes['button[type="submit"]']]) control.parentElement = modalForm;
    notice.parentElement = modal; noticeTitle.parentElement = notice; noticeMessage.parentElement = notice; noticeButton.parentElement = notice;
    modal.nodes = { form: modalForm, 'input[type="email"]': modalForm.elements.email,
        '[data-newsletter-form-view]': formView, '[data-newsletter-notice]': notice,
        '[data-newsletter-notice-title]': noticeTitle, '[data-newsletter-notice-message]': noticeMessage, '[data-newsletter-notice-button]': noticeButton };
    modal.members = [close, modalForm.elements.email, modalForm.elements.consent, modalForm.nodes['button[type="submit"]'], later, noticeButton];
    modal.many = { 'button:not([disabled]), input:not([tabindex="-1"]):not([disabled]), a[href]': modal.members };
    let first = true;
    doc.createElement = () => { const node = el(); if (!publication && first) { node.firstElementChild = modal; first = false; } return node; };
    const root = el(), pageForm = form(), action = el(), actionButton = el(), actionMessage = el(), signup = el(), readLink = el(); action.hidden = true; readLink.hidden = true;
    root.nodes = { form: pageForm, '[data-newsletter-action]': action, '[data-newsletter-page-signup]': signup, '[data-newsletter-read]': readLink };
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
        fetch: async (url, options) => { requests.push({ url, options, historyAtRequest: [...history] }); const next = responses.shift(); const code = next ? next.status : status; return { ok: code < 400, status: code, json: async () => next ? next.body : response }; } };
    vm.runInNewContext(source(publication ? 'publications' : 'newsletter'), context);
    return { doc, window, trigger, modal, modalForm, pageForm, actionButton, actionMessage, storage, requests, timers, history, recent, recentStatus, close, later, formView, notice, noticeTitle, noticeMessage, noticeButton, signup, readLink };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('consent gates requests and accepted subscriptions show a visible check-email popup without marking confirmation', async () => {
    const p = fixture(); const f = p.modalForm; p.window.CashPayNewsletter.open(p.trigger);
    f.elements.email.value = 'reader@example.invalid';
    await f.fire('submit'); assert.equal(p.requests.length, 0); assert.match(p.noticeMessage.textContent, /acceptez/);
    assert.equal(p.notice.hidden, false); assert.equal(p.doc.activeElement, p.noticeTitle);
    await p.noticeButton.fire('click'); assert.equal(p.formView.hidden, false);
    f.elements.consent.checked = true; await f.fire('submit');
    assert.equal(p.requests.length, 1); const request = p.requests[0];
    assert.equal(request.url, 'https://app.cashpay-all.com/api/main/newsletter/subscribe');
    assert.equal(request.options.credentials, 'omit'); assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { email: 'reader@example.invalid', language: 'fr', consent: true, website: '', startedAt: JSON.parse(request.options.body).startedAt });
    assert.equal(p.modal.hidden, false); assert.equal(p.formView.hidden, true); assert.equal(p.notice.hidden, false);
    assert.match(p.noticeTitle.textContent, /boîte mail/); assert.match(p.noticeMessage.textContent, /confirmer votre inscription/);
    assert.equal(p.modal.attrs.role, 'alertdialog'); assert.equal(p.doc.activeElement, p.noticeTitle);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined); assert.ok(p.storage['cashpay-newsletter-closed']);
});
test('modal traps focus, Escape returns focus, dismissal suppresses automatic reopening', async () => {
    const p = fixture(); assert.ok(p.timers.some(t => t.ms === 6000)); p.window.CashPayNewsletter.open(p.trigger);
    assert.equal(p.modal.hidden, false); assert.equal(p.doc.activeElement, p.modalForm.elements.email); assert.equal(p.doc.body.style.overflow, 'hidden');
    p.later.focus(); let prevented = false;
    await p.doc.fire('keydown', { key: 'Tab', shiftKey: false, preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.equal(p.doc.activeElement, p.close);
    await p.doc.fire('keydown', { key: 'Escape', preventDefault() {} });
    assert.equal(p.modal.hidden, true); assert.equal(p.doc.activeElement, p.trigger); assert.equal(p.doc.body.style.overflow, 'auto');
    const next = fixture({ storage: p.storage }); assert.equal(next.timers.some(t => t.ms === 6000), false);
    next.window.CashPayNewsletter.open(next.trigger); assert.equal(next.modal.hidden, false);
});
test('the email link removes its token before automatically confirming and shows success only after server acknowledgement', async () => {
    const token = 'c'.repeat(43); const p = fixture({ pageAction: 'confirm', hash: '#' + token, response: { ok: true, status: 'active' } });
    assert.equal(p.requests.length, 1); assert.deepEqual(p.requests[0].historyAtRequest, ['/newsletter.html?action=confirm']);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined); assert.equal(p.notice.hidden, true);
    await flush();
    assert.equal(p.requests[0].url, 'https://app.cashpay-all.com/api/main/newsletter/confirm');
    assert.deepEqual(JSON.parse(p.requests[0].options.body), { token }); assert.equal(p.storage['cashpay-newsletter-subscribed'], '1');
    assert.equal(p.modal.hidden, false); assert.equal(p.notice.hidden, false); assert.match(p.noticeTitle.textContent, /confirmée/);
    assert.match(p.actionMessage.textContent, /confirmée/); assert.equal(p.actionButton.hidden, true);
    assert.equal(p.signup.hidden, true); assert.equal(p.readLink.hidden, false); assert.equal(p.history.at(-1), '/newsletter.html');
    await p.actionButton.fire('click'); assert.equal(p.requests.length, 1);
    await p.doc.fire('keydown', { key: 'Escape', preventDefault() {} }); assert.equal(p.modal.hidden, true);
});
test('invalid or expired confirmation links cannot show success or mark the address subscribed', async () => {
    const bad = fixture({ pageAction: 'confirm', hash: '#short' });
    assert.equal(bad.actionButton.hidden, true); assert.equal(bad.requests.length, 0); assert.match(bad.noticeMessage.textContent, /invalide/);
    assert.equal(bad.storage['cashpay-newsletter-subscribed'], undefined);
    const expired = fixture({ pageAction: 'confirm', hash: '#' + 'e'.repeat(43), status: 400, response: { ok: false } });
    await flush(); assert.match(expired.noticeMessage.textContent, /invalide/); assert.equal(expired.actionButton.hidden, true);
    assert.equal(expired.storage['cashpay-newsletter-subscribed'], undefined);
});
test('temporary confirmation failure has a manual retry and never announces premature success', async () => {
    const p = fixture({ pageAction: 'confirm', hash: '#' + 'r'.repeat(43), responses: [
        { status: 503, body: { ok: false } }, { status: 200, body: { ok: true, status: 'active' } }
    ] });
    await flush(); assert.match(p.noticeMessage.textContent, /n’a pas pu aboutir/);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined); assert.equal(p.actionButton.disabled, false);
    await p.noticeButton.fire('click'); assert.equal(p.modal.hidden, true);
    await p.actionButton.fire('click'); assert.equal(p.requests.length, 2); assert.equal(p.storage['cashpay-newsletter-subscribed'], '1');
    assert.match(p.noticeTitle.textContent, /confirmée/);
});
test('prefetched or background confirmation pages wait until visible, then send just one validation request', async () => {
    for (const state of [{ hidden: true }, { prerendering: true }]) {
        const p = fixture({ pageAction: 'confirm', hash: '#' + 'v'.repeat(43), response: { ok: true, status: 'active' }, ...state });
        assert.equal(p.requests.length, 0); assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined);
        p.doc.hidden = false; p.doc.prerendering = false;
        await p.doc.fire('visibilitychange', {}); await p.doc.fire('prerenderingchange', {}); await flush();
        assert.equal(p.requests.length, 1); assert.equal(p.storage['cashpay-newsletter-subscribed'], '1');
    }
});
test('unsubscribe still needs a deliberate action and query-token confirmation links stay compatible', async () => {
    const p = fixture({ pageAction: 'unsubscribe', hash: '#' + 'u'.repeat(43), storage: { 'cashpay-newsletter-subscribed': '1' }, response: { ok: true, status: 'unsubscribed' } });
    assert.equal(p.requests.length, 0); await p.actionButton.fire('click'); assert.equal(p.requests.length, 1);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined); assert.match(p.noticeTitle.textContent, /Désinscription/);
    const legacy = fixture({ pageAction: 'confirm', search: '&token=' + 'q'.repeat(43), response: { ok: true, status: 'active' } });
    assert.equal(legacy.requests.length, 1); assert.equal(legacy.requests[0].historyAtRequest[0], '/newsletter.html?action=confirm');
    await flush(); assert.equal(legacy.storage['cashpay-newsletter-subscribed'], '1');
});
test('failed subscriptions keep the address, show a visible error popup and return to the form for retry', async () => {
    const p = fixture({ response: { ok: false }, status: 429 }), f = p.modalForm; p.window.CashPayNewsletter.open(p.trigger);
    f.elements.email.value = 'reader@example.invalid'; f.elements.consent.checked = true; await f.fire('submit');
    assert.equal(f.elements.email.value, 'reader@example.invalid'); assert.equal(f.nodes['button[type="submit"]'].disabled, false);
    assert.equal(p.modal.hidden, false); assert.equal(p.formView.hidden, true); assert.match(p.noticeMessage.textContent, /Trop de demandes/);
    assert.equal(p.storage['cashpay-newsletter-subscribed'], undefined);
    await p.noticeButton.fire('click'); assert.equal(p.formView.hidden, false); assert.equal(p.notice.hidden, true);
    assert.equal(p.doc.activeElement, f.nodes['button[type="submit"]']); assert.equal(f.elements.email.value, 'reader@example.invalid');
});
test('the permanent signup form also raises its acknowledgement above the page and returns focus when dismissed', async () => {
    const p = fixture({ pageAction: 'none' }), f = p.pageForm;
    f.elements.email.value = 'reader@example.invalid'; f.elements.consent.checked = true;
    await f.fire('submit'); assert.equal(p.modal.hidden, false); assert.equal(p.notice.hidden, false);
    assert.match(p.noticeMessage.textContent, /confirmer votre inscription/);
    await p.noticeButton.fire('click'); assert.equal(p.modal.hidden, true); assert.equal(p.doc.activeElement, f.nodes['button[type="submit"]']);
});
test('a result arriving after dismissal reopens visible feedback and keeps the original outside focus target', async () => {
    const p = fixture(), f = p.modalForm; p.window.CashPayNewsletter.open(p.trigger);
    f.elements.email.value = 'reader@example.invalid'; f.elements.consent.checked = true;
    const submitted = f.fire('submit'); p.window.CashPayNewsletter.close();
    assert.equal(p.modal.hidden, true); await submitted;
    assert.equal(p.modal.hidden, false); assert.equal(p.notice.hidden, false);
    await p.noticeButton.fire('click'); assert.equal(p.doc.activeElement, p.trigger);
    assert.ok(p.timers.some(timer => timer.ms === 30000));
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

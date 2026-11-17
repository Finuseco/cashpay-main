'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'jobs.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'js', 'jobs-data.json'), 'utf8'));

class Element {
    constructor(value = '') {
        this.value = value; this.hidden = false; this.disabled = false;
        this.innerHTML = ''; this.textContent = ''; this.style = {};
        this.files = []; this.checked = false; this.attrs = {}; this.listeners = {};
        this.classList = { toggle() {}, add() {}, remove() {} };
    }
    addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    checkValidity() { return true; }
    scrollIntoView() {}
    focus() { this.focused = true; }
}

async function fixture(status, payload, { networkFailure = false } = {}) {
    const nodes = new Map();
    const get = id => { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); };
    const form = get('job-form');
    const position = new Element(catalog.positions[0].key), gender = new Element('M');
    const steps = Array.from({ length: 5 }, () => new Element());
    form.elements = Object.fromEntries(['lastName', 'firstName', 'age', 'profession', 'phone', 'email'].map(name => [name, new Element('Valid') ]));
    Object.assign(form.elements.age, { value: '30' });
    form.elements.email.value = 'candidate@example.invalid';
    form.elements.phone.value = '+243812345678';
    form.querySelector = selector => selector.includes('name=province') ? get('f-province') : selector.includes('name=position') ? position : selector.includes('name=gender') ? gender : null;
    form.querySelectorAll = selector => selector === '.job-step' ? steps : [];
    get('province-box').querySelector = () => get('f-province');
    get('job-progress').querySelectorAll = () => steps;
    get('f-country').value = 'CD'; get('f-province').value = 'Kinshasa';
    get('f-photo').files = [{ name: 'photo.jpg', size: 50, type: 'image/jpeg' }];
    get('f-cv').files = [{ name: 'cv.pdf', size: 100, type: 'application/pdf' }];
    get('f-docs').files = []; get('f-consent').checked = true;
    get('job-submit').innerHTML = 'Envoyer';
    const box = get('job-done'), title = new Element(), description = new Element(), iconBox = new Element(), icon = new Element();
    title.attrs['data-i18n'] = 'jb.done.t'; description.attrs['data-i18n'] = 'jb.done.d';
    box.hidden = true;
    box.querySelector = selector => selector === 'h3' ? title : selector === '.job-done-ico' ? iconBox : selector === '[data-delivery-description]' ? description : selector === 'p[data-i18n="jb.done.d"]' && description.attrs['data-i18n'] ? description : null;
    iconBox.querySelector = () => icon;
    const listeners = {};
    const I18N = { lang: 'fr', en: {}, extend(data) { Object.assign(this.en, data); }, t(key, fallback) { return this.lang === 'en' && this.en[key] !== undefined ? this.en[key] : fallback; } };
    const document = { getElementById: get, addEventListener(name, fn) { (listeners[name] ||= []).push(fn); } };
    let requests = 0; const requestDetails = [];
    class FormDataStub { constructor() { this.data = {}; } set(k, v) { this.data[k] = v; } }
    vm.runInNewContext(source, {
        document, window: { I18N }, I18N, console, FormData: FormDataStub,
        fetch: async (url, options) => {
            if (url === 'js/jobs-data.json') return { json: async () => catalog };
            requests++; requestDetails.push({ url, options });
            if (networkFailure) throw Error('network unavailable');
            return { ok: status >= 200 && status < 300, status, json: async () => payload };
        }
    }, { filename: 'js/jobs.js' });
    await new Promise(resolve => setImmediate(resolve));
    return {
        get, form, box, title, description, iconBox, icon, requestDetails,
        get requests() { return requests; },
        async submit() { for (const fn of form.listeners.submit) await fn({ preventDefault() {} }); },
        language(language) { I18N.lang = language; for (const fn of listeners.langchange || []) fn(); }
    };
}

test('the form posts to the app subdomain and displays only confirmed acceptance', async () => {
    const page = await fixture(200, { ok: true, ref: 'CP-261117-ABCDEF', saved: false, retryScheduled: false, delivery: { internal: 'accepted', acknowledgement: 'accepted' } });
    await page.submit();
    assert.equal(page.requests, 1); assert.equal(page.form.hidden, true); assert.equal(page.box.hidden, false);
    assert.equal(page.requestDetails[0].url, 'https://app.cashpay-all.com/api/careers');
    assert.equal(page.requestDetails[0].options.method, 'POST');
    assert.equal(page.requestDetails[0].options.credentials, 'omit');
    assert.equal(page.box.attrs['data-delivery-state'], 'accepted');
    assert.match(page.description.textContent, /messagerie a accepté/);
    assert.equal(page.iconBox.style.color, '#25D366');
    assert.doesNotMatch(page.description.textContent, /enregistr|stock|reprise/i);
    page.language('en');
    assert.match(page.description.textContent, /mail service has accepted/);
    assert.equal(page.box.attrs['data-delivery-state'], 'accepted');
    await page.submit(); assert.equal(page.requests, 1);
});

test('saved-only, pending and old receipts retain the form without claiming mail acceptance', async () => {
    for (const [status, payload] of [
        [202, { ok: true, ref: 'CP-261117-ABCDEF', saved: true, delivery: { internal: 'pending', acknowledgement: 'pending' } }],
        [200, { ok: true, ref: 'CP-261117-ABCDEF' }],
        [202, { ok: true, ref: 'CP-261117-ABCDEF', saved: true, retryScheduled: false }]
    ]) {
        const page = await fixture(status, payload);
        await page.submit();
        assert.equal(page.form.hidden, false); assert.equal(page.box.hidden, true);
        assert.equal(page.get('f-cv').files[0].name, 'cv.pdf');
        assert.match(page.get('job-error').textContent, /ne confirme pas/);
        assert.doesNotMatch(page.get('job-error').textContent, /enregistrée|stockée|automatique/);
        page.language('en');
        assert.match(page.get('job-error').textContent, /did not confirm/);
        assert.equal(page.requests, 1);
    }
});

test('an unconfirmed acknowledgement preserves internal acceptance without resubmission in both languages', async () => {
    const page = await fixture(200, { ok: true, ref: 'CP-261117-ABCDEF', saved: false, retryScheduled: false, delivery: { internal: 'accepted', acknowledgement: 'failed' } });
    await page.submit();
    assert.equal(page.box.attrs['data-delivery-state'], 'partial');
    assert.match(page.title.textContent, /accusé non confirmé/);
    assert.match(page.description.textContent, /pas nécessaire de renvoyer/);
    assert.equal(page.get('job-ref').textContent, 'CP-261117-ABCDEF');
    assert.equal(page.title.attrs['data-i18n'], undefined);
    assert.notEqual(page.iconBox.style.color, '#25D366');
    page.language('en');
    assert.match(page.title.textContent, /acknowledgement unconfirmed/);
    assert.match(page.description.textContent, /do not need to submit/);
    await page.submit(); assert.equal(page.requests, 1);
});

test('unconfirmed internal mail keeps documents and asks for receipt verification before retry', async () => {
    const page = await fixture(503, { ok: false, saved: false, error: 'mail_unavailable', delivery: { internal: 'failed', acknowledgement: 'not_sent' } });
    await page.submit();
    assert.equal(page.form.hidden, false); assert.equal(page.box.hidden, true);
    assert.match(page.get('job-error').textContent, /envoi.*n’a pas pu être confirmé/);
    assert.match(page.get('job-error').textContent, /Vérifiez la réception.*avant de soumettre à nouveau/);
    assert.match(page.get('job-error').textContent, /restent sur cette page/);
    assert.equal(page.get('f-cv').files[0].name, 'cv.pdf');
    assert.equal(page.get('f-photo').files[0].name, 'photo.jpg');
    assert.equal(page.get('job-submit').disabled, false);
    assert.equal(page.requests, 1);
    page.language('en');
    assert.match(page.get('job-error').textContent, /could not confirm that your application was sent/);
    assert.match(page.get('job-error').textContent, /Check receipt with our team before submitting again/);
    assert.match(page.get('job-error').textContent, /still on this page/);
});

test('network failure reports uncertainty and never retries or clears selected files', async () => {
    const page = await fixture(0, null, { networkFailure: true });
    await page.submit();
    assert.equal(page.form.hidden, false); assert.equal(page.box.hidden, true);
    assert.match(page.get('job-error').textContent, /résultat.*n’a pas pu être confirmé/);
    assert.match(page.get('job-error').textContent, /avant de soumettre à nouveau/);
    assert.equal(page.get('f-cv').files[0].name, 'cv.pdf');
    assert.equal(page.requests, 1); assert.equal(page.get('job-submit').disabled, false);
    page.language('en');
    assert.match(page.get('job-error').textContent, /could not confirm the result/);
    assert.equal(page.requests, 1);
});

test('an artificial anti-robot receipt cannot be displayed as a real application', async () => {
    const page = await fixture(200, { ok: true, ref: 'CP-OK', delivery: { internal: 'accepted', acknowledgement: 'accepted' } });
    await page.submit();
    assert.equal(page.form.hidden, false); assert.equal(page.box.hidden, true);
    assert.equal(page.get('job-error').hidden, false);
});

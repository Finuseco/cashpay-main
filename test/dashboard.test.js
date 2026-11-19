'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const dashboard = require(path.join(root, 'js/dashboard.js'));
const { API_BASE, apiRequest, allowedAdmin, articlePayload, safeUrl } = dashboard;

const response = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    headers: { get: () => 'application/json' }
});

const article = overrides => ({
    title: 'Une publication CashPay',
    slug: 'publication-cashpay',
    excerpt: 'Une introduction utile.',
    kind: 'article',
    coverUrl: 'https://www.cashpay-all.com/cover.png',
    coverAlt: 'CashPay All',
    status: 'draft',
    publishAt: '',
    notifySubscribers: false,
    ...overrides
});

test('the admin client uses the Main API and browser cookies without persistent wallet credentials', async () => {
    assert.equal(API_BASE, 'https://app.cashpay-all.com/api/main');
    const calls = [];
    const fetcher = async (url, options) => { calls.push({ url, options }); return response({ success: true, user: { role: 'Admin' } }); };
    await apiRequest('/auth/session', {}, fetcher);
    await apiRequest('/auth/start', { method: 'POST', body: { walletId: 'WALLET-123', channel: 'email' } }, fetcher);
    assert.equal(calls[0].url, `${API_BASE}/auth/session`);
    assert.equal(calls[0].options.credentials, 'include');
    assert.equal(calls[1].url, `${API_BASE}/auth/start`);
    assert.equal(calls[1].options.credentials, 'include');
    assert.equal(calls[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(calls[1].options.body), { walletId: 'WALLET-123', channel: 'email' });
    const headers = new Headers(calls[1].options.headers);
    assert.match(headers.get('Content-Type'), /application\/json/i);
    assert.equal(headers.get('Authorization'), null);
    const source = fs.readFileSync(path.join(root, 'js/dashboard.js'), 'utf8');
    assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage)\b/);
    assert.doesNotMatch(source, /Authorization\s*:\s*['"`]Bearer/i);
});

test('the API client rejects HTTP and application failures instead of rendering false success', async () => {
    await assert.rejects(apiRequest('/admin/articles', {}, async () => response({ success: false, error: 'session_expired' }, 401)));
    await assert.rejects(apiRequest('/admin/articles', {}, async () => response({ success: false, error: 'publication_failed' })));
    await assert.rejects(apiRequest('/admin/articles', {}, async () => { throw new Error('Network unavailable'); }));
});

test('only an admin role opens the dashboard, including the wallet API Admin capitalization', () => {
    assert.equal(allowedAdmin({ id: 'a', role: 'Admin' }), true);
    assert.equal(allowedAdmin({ id: 'b', role: 'admin' }), true);
    for (const user of [null, {}, { role: '' }, { role: 'user' }, { role: 'superadmin' }, { role: 'editor' }, { isAdmin: true }]) {
        assert.equal(allowedAdmin(user), false);
    }
});

test('article payload preserves rich HTML, publication type and explicit newsletter choice', () => {
    const html = '<section><h2>Un titre</h2><p>Texte <strong>utile</strong>.</p></section>';
    for (const kind of ['article', 'communique', 'advertisement']) {
        const payload = articlePayload(article({ kind }), html);
        assert.equal(payload.kind, kind);
        assert.equal(payload.bodyHtml, html);
        assert.equal(payload.title, 'Une publication CashPay');
        assert.equal(payload.slug, 'publication-cashpay');
        assert.equal(payload.status, 'draft');
        assert.equal(payload.notifySubscribers, false);
        assert.equal(payload.coverUrl, 'https://www.cashpay-all.com/cover.png');
        assert.equal(payload.coverAlt, 'CashPay All');
    }
    assert.equal(articlePayload(article({ status: 'published', notifySubscribers: true }), html).notifySubscribers, true);
});

test('article scheduling is a future instant and invalid drafts cannot reach publication', () => {
    const payload = articlePayload(article({ status: 'scheduled', publishAt: '2099-06-15T12:30:00Z' }), '<p>Publication planifiée.</p>');
    assert.equal(payload.status, 'scheduled');
    assert.equal(new Date(payload.publishAt).toISOString(), '2099-06-15T12:30:00.000Z');
    for (const values of [
        { title: '   ' }, { kind: 'press' }, { status: 'approved' },
        { status: 'scheduled', publishAt: '' },
        { status: 'scheduled', publishAt: 'not-a-date' },
        { status: 'scheduled', publishAt: '2000-01-01T00:00' },
        { slug: '../../private' },
        { coverUrl: 'javascript:alert(1)' }
    ]) {
        assert.throws(() => articlePayload(article(values), '<p>Un texte valide.</p>'));
    }
    assert.throws(() => articlePayload(article(), ''));
});

test('URL validation accepts normal editorial links and rejects executable or embedded image sources', () => {
    assert.equal(safeUrl('https://cashpay-all.com/page'), 'https://cashpay-all.com/page');
    assert.ok(safeUrl('mailto:info@cashpay-all.com'));
    assert.ok(safeUrl('tel:+243853868021'));
    assert.ok(safeUrl('https://cashpay-all.com/image.jpg', { image: true }));
    for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', '//evil.example/x', '/relative', 'file:///etc/passwd']) {
        assert.equal(safeUrl(url), '');
        assert.equal(safeUrl(url, { image: true }), '');
    }
    assert.equal(safeUrl('mailto:info@cashpay-all.com', { image: true }), '');
});

const chromium = process.env.CHROMIUM_BIN || '/usr/bin/chromium';
test('the rich HTML sanitizer removes active content in a real browser while retaining article sections', { skip: !fs.existsSync(chromium) }, (context) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cashpay-editor-test-'));
    try {
        const sourceURL = pathToFileURL(path.join(root, 'js/dashboard.js')).href;
        const input = '<section><h2>Titre</h2><p><strong>Texte</strong> <a href="https://cashpay-all.com">CashPay</a></p><table><tbody><tr><td>Cellule</td></tr></tbody></table><img src="https://cashpay-all.com/photo.jpg" alt="Photo" onerror="alert(1)"><a href="javascript:alert(1)">Dangereux</a><script>window.evil=1</script><svg onload="alert(1)"></svg><iframe src="https://evil.example"></iframe></section>';
        fs.writeFileSync(path.join(directory, 'sanitizer.html'), `<!doctype html><meta charset="utf-8"><script src="${sourceURL}"></script><pre id="result"></pre><script>try { const html = window.CashPayDashboard.sanitizeHtml(${JSON.stringify(input).replace(/</g, '\\u003c')}, document); document.getElementById('result').textContent = JSON.stringify({html,evil:Boolean(window.evil)}); } catch(error) { document.getElementById('result').textContent = JSON.stringify({error:String(error)}); }</script>`);
        const result = spawnSync(chromium, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=${path.join(directory, 'browser-profile')}`, '--dump-dom', pathToFileURL(path.join(directory, 'sanitizer.html')).href], { encoding: 'utf8', timeout: 20000, maxBuffer: 2 * 1024 * 1024 });
        if (result.status === null && /Operation not permitted|No usable sandbox/.test(result.stderr)) { context.skip('Chromium cannot run in this execution sandbox'); return; }
        assert.equal(result.status, 0, result.stderr);
        const match = result.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/);
        assert.ok(match, result.stdout);
        const escaped = match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        const rendered = JSON.parse(escaped);
        assert.equal(rendered.error, undefined);
        assert.equal(rendered.evil, false);
        assert.match(rendered.html, /<section>/);
        assert.match(rendered.html, /<h2>Titre<\/h2>/);
        assert.match(rendered.html, /<table>/);
        assert.match(rendered.html, /<strong>Texte<\/strong>/);
        assert.doesNotMatch(rendered.html, /<script|<svg|onerror|onload|javascript:|evil\.example/i);
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

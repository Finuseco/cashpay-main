'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('the public header exposes an accessible administration link to the existing Wallet OTP PIN page', () => {
    const header = { innerHTML: '' }, translations = {};
    const document = {
        getElementById(id) {
            if (id === 'site-header') return header;
            return ['wa-float', 'cashpay-newsletter-css', 'cashpay-newsletter-js'].includes(id) ? {} : null;
        },
        body: { getAttribute() { return 'home'; } },
        querySelectorAll() { return []; }
    };
    const window = { I18N: { extend(values) { Object.assign(translations, values); } } };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/layout.js'), 'utf8'), { window, document, I18N: window.I18N });
    window.renderLayout();
    const link = header.innerHTML.match(/<a class="nav-admin-login"[\s\S]*?<\/a>/)?.[0];
    assert.ok(link, 'The icon must be in the shared public navigation.');
    assert.match(link, /href="dashboard\.html"/);
    assert.match(link, /aria-hidden="true"/);
    assert.match(link, /class="sr-only"[^>]*>Se connecter à l’administration/);
    assert.equal(translations['nav.admin.login'], 'Sign in to administration');
    assert.match(header.innerHTML, /href="https:\/\/app\.cashpay-all\.com"[^>]*data-i18n="nav\.open"/);
    const dashboard = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
    for (const form of ['wallet-form', 'otp-form', 'pin-form']) assert.match(dashboard, new RegExp(`id="${form}"`));
});

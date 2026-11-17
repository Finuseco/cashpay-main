'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { createService } = require('../server');
function request(method, url) {
    const server = createService();
    const req = Readable.from([Buffer.from('legacy multipart body')]);
    Object.assign(req, { method, url });
    let status, headers, body;
    server.handleRequest(req, { writeHead(value, h) { status = value; headers = h; }, end(value) { body = JSON.parse(value); } });
    return { status, headers, body, server };
}
test('legacy POST cannot save or queue a candidature and points to the app endpoint', () => {
    const result = request('POST', '/api/careers');
    assert.equal(result.status, 410);
    assert.equal(result.body.ok, false);
    assert.equal(result.body.saved, false);
    assert.equal(result.body.error, 'endpoint_moved');
    assert.equal(result.body.endpoint, 'https://app.cashpay-all.com/api/careers');
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.equal(result.server.startMailRetries, undefined);
});
test('legacy health explicitly reports the local service inactive with no storage or retry worker', () => {
    const result = request('GET', '/api/careers/health');
    assert.equal(result.status, 200);
    assert.equal(result.body.active, false);
    assert.equal(result.body.storage, false);
    assert.equal(result.body.retries, false);
    assert.equal(result.body.endpoint, 'https://app.cashpay-all.com/api/careers');
});

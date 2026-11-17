/* Ancien service Carrières : réception et envois désormais assurés par CashPay Web.
   Ce point de compatibilité ne lit ni ne conserve de candidature. */
'use strict';
const http = require('node:http');
const ENDPOINT = 'https://app.cashpay-all.com/api/careers';
function createService() {
    const server = http.createServer((req, res) => {
        const url = String(req.url || '').split('?')[0];
        const health = req.method === 'GET' && /^\/api\/careers\/health\/?$/.test(url);
        const body = JSON.stringify(health
            ? { ok: true, active: false, endpoint: ENDPOINT, storage: false, retries: false }
            : { ok: false, saved: false, error: 'endpoint_moved', endpoint: ENDPOINT,
                message: 'Le formulaire a été mis à jour. Rechargez la page avant de soumettre votre candidature.' });
        res.writeHead(health ? 200 : 410, { 'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(body), 'Connection': 'close' });
        res.end(body);
        req.resume();
    });
    server.handleRequest = server.listeners('request')[0];
    return server;
}
const server = createService();
if (require.main === module) server.listen(Number(process.env.PORT || 8010), process.env.HOST || '127.0.0.1', () => {
    console.log('[careers] service local retiré ; endpoint ' + ENDPOINT);
});
module.exports = server;
module.exports.createService = createService;

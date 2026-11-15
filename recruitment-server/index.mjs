import { createApp, loadCatalog } from './app.mjs';

const port = Number(process.env.PORT || 3100);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid recruitment port');
const application = createApp({ catalog: await loadCatalog() });
application.server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Service recrutement prêt sur le port ${port}.`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => application.server.close(() => { application.mailer.close(); process.exit(0); }));

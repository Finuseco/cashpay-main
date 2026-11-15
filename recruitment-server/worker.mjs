import { configuration } from './config.mjs';
import { createMailer, flushQueue } from './mailer.mjs';

const config = configuration();
const mailer = createMailer(config);
try { console.log(JSON.stringify(await flushQueue(config, mailer))); }
catch { console.error('La file de recrutement ne peut pas être traitée. Vérifiez la configuration SMTP et le stockage privé.'); process.exitCode = 1; }
finally { mailer.close(); }

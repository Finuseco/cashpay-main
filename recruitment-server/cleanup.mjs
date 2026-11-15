import { configuration } from './config.mjs';
import { cleanOldApplications } from './storage.mjs';

try { console.log(JSON.stringify(await cleanOldApplications(configuration()))); }
catch { console.error('Le nettoyage du stockage privé de recrutement a échoué.'); process.exitCode = 1; }

// Cross-platform launcher for `npm run stop`
// Delegates to dev-stop.ps1 (Windows) or dev-stop.sh (Mac/Linux)
// Pass --stop-postgres to also stop the database service.
'use strict';
const { execSync } = require('child_process');
const path = require('path');
const dir = __dirname;
const stopPg = process.argv.includes('--stop-postgres');

if (process.platform === 'win32') {
  const flag = stopPg ? ' -StopPostgres' : '';
  execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(dir,'dev-stop.ps1')}"${flag}`, { stdio:'inherit' });
} else {
  const flag = stopPg ? ' --stop-postgres' : '';
  execSync(`bash "${path.join(dir,'dev-stop.sh')}"${flag}`, { stdio:'inherit' });
}

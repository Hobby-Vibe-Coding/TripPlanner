// Cross-platform launcher for `npm run dev`
// Delegates to dev-start.ps1 (Windows) or dev-start.sh (Mac/Linux)
'use strict';
const { execSync } = require('child_process');
const path = require('path');
const dir = __dirname;

if (process.platform === 'win32') {
  execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(dir,'dev-start.ps1')}"`, { stdio:'inherit' });
} else {
  execSync(`bash "${path.join(dir,'dev-start.sh')}"`, { stdio:'inherit' });
}

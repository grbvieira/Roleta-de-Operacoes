const path = require('node:path');
require('./sync-license.cjs');
process.env.ELECTRON_CACHE = path.resolve('.cache/electron');
process.env.ELECTRON_BUILDER_CACHE = path.resolve('.cache/electron-builder');
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
const { build, Platform, Arch } = require('electron-builder');
const targets = process.argv.includes('--dir') ? ['dir'] : ['nsis', 'zip'];
build({ targets: Platform.WINDOWS.createTarget(targets, Arch.x64), publish: 'never' })
  .catch(error => { console.error(error); process.exitCode = 1; });

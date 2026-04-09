#!/usr/bin/env node
// Entry point — routes 'init' to the setup wizard, everything else starts the MCP server
if (process.argv[2] === 'init') {
  await import('./bin/init.js');
} else {
  await import('./index.js');
}

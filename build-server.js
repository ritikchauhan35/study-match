// Build script to compile TypeScript files for server use
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Run TypeScript compiler
exec('npx tsc --project tsconfig.server.json', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error compiling TypeScript: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`TypeScript compiler stderr: ${stderr}`);
  }
  console.log(`TypeScript compilation successful: ${stdout}`);
});
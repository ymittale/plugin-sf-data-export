#!/usr/bin/env node

// eslint-disable-next-line node/shebang
/*async function main() {
  const {execute} = await import('@oclif/core')
  await execute({dir: import.meta.url})
}

await main()*/

import { execute } from '@oclif/core';
import { fileURLToPath } from 'node:url';

async function main() {
  // We use fileURLToPath to ensure the path is correctly interpreted
  // inside the pkg 'snapshot' filesystem
  const projectRoot = fileURLToPath(import.meta.url);

  try {
    await execute({ dir: projectRoot });
  } catch (err) {
    // If it fails, we want to see the error in the terminal
    console.error('Execution Error:', err);
    process.exit(1);
  }
}

main();

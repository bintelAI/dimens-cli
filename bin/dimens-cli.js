#!/usr/bin/env node

import { runCLI } from '../dist/index.mjs';

const exitCode = await runCLI(process.argv.slice(2));
process.exit(exitCode);

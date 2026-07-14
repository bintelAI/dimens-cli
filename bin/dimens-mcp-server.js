#!/usr/bin/env node

import { runDimensMcpServer } from '../dist/index.mjs';

try {
  await runDimensMcpServer();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`dimens-mcp-server 启动失败: ${message}\n`);
  process.exit(1);
}

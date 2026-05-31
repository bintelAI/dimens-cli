#!/usr/bin/env node

import { runDimensMcpHttpServer } from '../dist/index.mjs';

try {
  await runDimensMcpHttpServer();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`dimens-mcp-http-server 启动失败: ${message}\n`);
  process.exit(1);
}

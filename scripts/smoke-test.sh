#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

DEFAULT_BASE_URL="https://dimens.bintelai.com"
BASE_URL="${DIMENS_BASE_URL:-$DEFAULT_BASE_URL}"

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "缺少环境变量: $name" >&2
    exit 1
  fi
}

require_env "DIMENS_API_KEY"
require_env "DIMENS_API_SECRET"
require_env "DIMENS_TEAM_ID"

echo "[1/6] 构建本地 CLI"
pnpm build

echo "[2/6] 查看帮助"
node ./bin/dimens-cli.js help >/dev/null

echo "[3/6] 使用 API Key 换取 token"
node ./bin/dimens-cli.js auth api-key-login \
  --base-url "$BASE_URL" \
  --api-key "$DIMENS_API_KEY" \
  --api-secret "$DIMENS_API_SECRET"

echo "[4/6] 写入默认团队"
node ./bin/dimens-cli.js auth use-team "$DIMENS_TEAM_ID"

echo "[5/6] 获取项目列表"
node ./bin/dimens-cli.js project list --team-id "$DIMENS_TEAM_ID"

echo "[6/6] 调用 AI chat completions"
node ./bin/dimens-cli.js ai chat-completions \
  --team-id "$DIMENS_TEAM_ID" \
  --message "${DIMENS_SMOKE_MESSAGE:-CLI smoke test}" \
  --model "${DIMENS_SMOKE_MODEL:-default}"

echo "smoke test 完成"

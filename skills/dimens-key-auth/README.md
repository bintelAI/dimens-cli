# dimens-key-auth

## 技能简介

`dimens-key-auth` 用于处理维表智联中的 API Key / API Secret 登录换 token、第三方系统接入边界、Key 安全规则和权限继承问题。

## 适用场景

- 需要用 `apiKey + apiSecret` 登录
- 需要解释 token 获取与复用链路
- 需要排查 Key 可用但接口无权限的问题
- 需要说明 IP 白名单、过期时间、Secret 重置等规则

## 快速开始

```bash
dimens-cli auth api-key-login \
  --api-key ak_xxx \
  --api-secret sk_xxx
```

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：登录流、示例、能力边界等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 参考资料

- `references/login-flow.md`
- `references/examples.md`
- `references/integration-boundaries.md`
- `references/capability-status.md`

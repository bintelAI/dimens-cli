# Windows 中文写入 UTF-8 规范

## 1. 目标

在 Windows 系统使用维表智联 Skills 时，凡是生成 Markdown、JSON、Draw.io、画布 JSON、脚本、技能文件、说明文档或其他包含中文的文件，都必须保证写入链路是 UTF-8，避免中文被写成 `??`。

`??` 通常不是普通显示乱码，而是写入阶段已经发生有损替换。出现后很难从文件本身恢复原文，只能重新生成或从历史版本找回。

## 2. 必须遵守

- ✅ 中文文件统一保存为 UTF-8。
- ✅ Windows 下写中文文件前，先确认终端、脚本和编辑器都按 UTF-8 处理。
- ✅ 写入后必须重新读取文件，确认中文没有变成 `??`。
- ✅ 技能生成包含中文的文件时，优先使用 Node.js `fs.writeFileSync(file, content, "utf8")` 或 PowerShell 显式 `-Encoding utf8`。
- ✅ JSON、Markdown、Draw.io XML、画布 JSON、技能文档都按 UTF-8 写入。
- ❌ 不要使用 Windows `cmd.exe` 的 `echo 中文 > file.md` 或 `echo 中文 >> file.md` 写入中文正文。
- ❌ 不要依赖 Windows PowerShell 5.1 的默认 `Out-File` / `Set-Content` 编码。
- ❌ 不要用未指定编码的脚本读取后再覆盖中文文件。

## 3. 先检查 Windows 终端编码

在 `cmd.exe` 或 PowerShell 中先执行：

```bat
chcp
```

推荐结果：

```text
Active code page: 65001
```

如果不是 65001，先切到 UTF-8：

```bat
chcp 65001
```

PowerShell 中建议额外设置：

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()
```

## 4. 推荐写入方式

### 4.1 Node.js 写入

最推荐用 Node.js 明确 UTF-8 写文件：

```js
import { readFileSync, writeFileSync } from "node:fs";

const content = `# 项目说明

这里是中文内容。
`;

writeFileSync("README.md", content, "utf8");

const saved = readFileSync("README.md", "utf8");
if (saved.includes("??")) {
  throw new Error("中文写入疑似损坏：文件中出现 ??");
}
```

### 4.2 PowerShell 7 写入

PowerShell 7 推荐：

```powershell
@"
# 项目说明

这里是中文内容。
"@ | Set-Content -Path .\README.md -Encoding utf8
```

如果环境支持 `utf8NoBOM`，也可以：

```powershell
@"
# 项目说明

这里是中文内容。
"@ | Set-Content -Path .\README.md -Encoding utf8NoBOM
```

### 4.3 Windows PowerShell 5.1 写入

Windows PowerShell 5.1 必须显式指定编码：

```powershell
@"
# 项目说明

这里是中文内容。
"@ | Set-Content -Path .\README.md -Encoding UTF8
```

注意：PowerShell 5.1 的 `-Encoding UTF8` 通常会带 BOM。多数场景可以接受，但跨平台包内文本更推荐 PowerShell 7 或 Node.js 写入。

## 5. 禁止写法

下面这些写法在 Windows 下容易把中文写成 `??`：

```bat
echo 中文内容 > README.md
echo 继续追加中文 >> README.md
```

```powershell
"中文内容" > README.md
"中文内容" | Out-File README.md
Set-Content README.md "中文内容"
```

除非显式确认编码，否则不要用这些方式写中文正文。

## 6. 写入后验证

写入后至少做一次读取验证。

Node.js：

```js
import { readFileSync } from "node:fs";

const saved = readFileSync("README.md", "utf8");
if (saved.includes("??")) {
  throw new Error("文件中出现 ??，请按 UTF-8 重新写入");
}
console.log(saved.slice(0, 200));
```

PowerShell：

```powershell
$saved = Get-Content .\README.md -Raw -Encoding utf8
if ($saved.Contains("??")) {
  throw "文件中出现 ??，请按 UTF-8 重新写入"
}
$saved.Substring(0, [Math]::Min(200, $saved.Length))
```

## 7. 技能生成文件时的提示词要求

当 Skill 要求 AI 生成或修改文件，尤其是中文文件时，提示词里必须包含：

```text
Windows 环境下写入中文文件必须使用 UTF-8。
不要使用 cmd echo / 重定向写入中文正文。
优先使用 Node.js fs.writeFileSync(file, content, "utf8") 或 PowerShell Set-Content -Encoding utf8。
写入后重新读取文件，确认中文没有变成 ??。
```

如果是生成 Markdown / JSON / 画布 JSON / Draw.io XML / 技能文件，补充：

```text
生成文件保存为 UTF-8；如果读取后发现 ??，说明写入已损坏，必须重新按 UTF-8 写入。
```

## 8. 判断问题出在哪里

| 现象 | 说明 | 处理 |
| --- | --- | --- |
| AI 输出区中文正常，文件里是 `??` | 写文件链路损坏 | 改用 UTF-8 写入方式重新生成 |
| 文件在 VS Code 显示乱码，但不是 `??` | 可能只是打开编码错 | 用 UTF-8 重新打开或另存 |
| 文件实际内容已经是 `??` | 原文已丢失 | 从历史版本恢复或重新生成 |
| JSON 中中文变成 `??` | 生成或保存阶段编码损坏 | 重新生成 JSON，并用 UTF-8 写入 |
| Markdown 标题变 `????` | 终端重定向或默认编码问题 | 禁止 `echo > file`，改 Node.js / PowerShell UTF-8 |

## 9. VS Code 设置建议

建议在 Windows 项目里确认 VS Code：

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

如果打开文件发现编码不是 UTF-8，使用：

```text
Reopen with Encoding -> UTF-8
Save with Encoding -> UTF-8
```

## 10. 一句话规则

Windows 下所有包含中文的生成文件，都不要用默认编码和 `cmd echo` 写入；统一 UTF-8 写入，写完立即读回检查，发现 `??` 就重新生成。

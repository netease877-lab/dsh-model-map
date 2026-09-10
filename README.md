# dsh-model-map

[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4d6bfe)](https://github.com/deepseek-ai/deepseek-harness)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Release](https://img.shields.io/badge/Release-v0.2.1-blue)](../../releases)

**English** | [简体中文](#简体中文)

Give the **DeepSeek models served by your third-party provider** the official capabilities they ship without — thinking-effort levels and vision — by mapping them onto official DeepSeek models. Pick a provider model, pick an official model, save. The mapped model instantly gains the official entry's image input (vision), thinking-effort levels, and — the piece other plugins miss — the **official DeepSeek wire dialect** (`thinking` + `reasoning_effort`), so DeepSeek-protocol relays accept the request exactly as they would the official API's.

> **Scope: DeepSeek models only.** This plugin exists for one problem: third-party providers serving *DeepSeek* models (official-API relays, aggregators, self-hosted gateways) ship them without thinking levels or vision. It is **not** a general adapter that makes other vendors' models (GPT, Gemini, Qwen, GLM, …) vision-capable or thinking-capable — their wire dialects differ and are out of scope.

```sh
dsh plugin --profile web add github:netease877-lab/dsh-model-map
```

Restart `dsh web` once after installing, then open **Settings → 模型映射 (Model Mapping)**.

## Why this one

Other plugins in the ecosystem repair *reasoning effort* for third-party models — they auto-fill an `reasoningEfforts` dict, or rewrite the level mid-request. That fixes the picker, but a DeepSeek-dialect relay still rejects or mishandles the request, and vision stays closed. This plugin takes a different angle: **it stamps the mapped model with the official model's full capability declaration**, the same fields the official catalog itself carries.

| | Effort-picker plugins (auto-fill / override / rules) | **dsh-model-map** |
|---|---|---|
| Thinking levels offered | ✔ | ✔ (from the official entry) |
| Wire dialect (`thinking:{type}` + `reasoning_effort`) | ✘ — picker only | ✔ official DeepSeek dialect, or plain-OpenAI via a switch |
| `off` → explicit `thinking:{type:"disabled"}` | ✘ | ✔ byte-identical to official requests |
| Vision admission (`input: [text, image]`) | ✘ usually untouched | ✔ |
| Where the capability facts come from | a knowledge base / heuristics / your YAML | **the running dsh's own official catalog** |
| Hardcoded model tables | sometimes | **none** |

What "no hardcoded tables" means in practice: the mapping picker is filled from the same session model-catalog RPC the composer's model selector uses, and each save resolves the target's facts (name, modalities, efforts) live from the official route. **When a dsh update adds or renames official models, the picker and new stamps follow automatically — the plugin never needs an update for that.**

Wire alignment is not aspirational: a mapped model's request is built by the same code path dsh's own test suite pins for the official dialect — `thinking:{type:"enabled"}, reasoning_effort:"high"` when thinking is selected; `thinking:{type:"disabled"}` with no effort field when it is off.

## Usage

1. Configure your third-party provider on the official **Models** page (base URL + API key + models).
2. Open **Settings → 模型映射** — a top-level page, sibling of Models/Plugins:
   - **Provider** — your third-party route;
   - **Third-party model** — a dropdown fed by that provider's own model list;
   - **Map to official model** — a dropdown of the live official catalog (auto-detected);
   - **Style** — `deepseek` (official dialect: `thinking` + `reasoning_effort`; use this for relays of the official API) or `openai` (bare `reasoning_effort`, for ordinary OpenAI-compatible endpoints; switch if `deepseek` style 400s).
3. **Save** — effective immediately, no restart. Deleting a mapping withdraws only the stamped fields; hand-edited model entries are never touched.

## How it works

The plugin registers a `model-map` settings namespace and translates every change into capability stamps on the matching `llm-pi-ai` provider profile: `name`, `input`, `reasoningEfforts`, and `compat` (`thinkingFormat`, `maxTokensField`, `requiresReasoningContentOnAssistantMessages`, …) — exactly the fields pi-ai folds into the materialized model, which is why the Models page, composer selector, image admission, and effort menu all light up natively. Requests still go to your third-party endpoint; only the capability declaration moves.

The browser reads the official entries through the standard session `modelCatalog` RPC; the host resolves capability facts through `listModels` + `resolveModelInfo` at stamp time. If the official catalog is momentarily unreadable, mappings stay pending rather than writing invented values. Deliberately **not** copied: context window, max tokens, pricing, image pixel budgets — those are your endpoint's own facts and stay as you configured them.

## Install

```sh
# from GitHub (lib/ is prebuilt — no build scripts run, no allowBuilds prompts)
dsh plugin --profile web add github:netease877-lab/dsh-model-map

# or pin a release tarball
dsh plugin --profile web add github:netease877-lab/dsh-model-map#v0.2.1
```

Requires a DeepSeek Harness `0.1.x` web profile. Uninstall with `dsh plugin --profile web remove dsh-model-map`.

## Build from source

```sh
npm install
DSH_REPO=/path/to/deepseek-harness node build.mjs
```

The host half is self-contained (schemastery vendored in); the client half resolves react through dsh's platform module table.

## License

[MIT](./LICENSE)

---

<a id="简体中文"></a>

# dsh-model-map（模型映射）

**解决一个具体问题：第三方供应商提供的 DeepSeek 模型没有思考强度档位和识图**。把它们映射成官方 DeepSeek 模型即可——左边选第三方模型，右边选官方模型，保存即生效：立刻获得官方条目的识图、思考强度档位，以及其他同类插件没有的那块：**官方 DeepSeek 线缆方言**（`thinking` + `reasoning_effort`），DeepSeek 协议的中转站会像对待官方 API 一样接受请求。

> **范围：只针对 DeepSeek 模型。** 适用于官方 API 中转站、聚合站、自建网关等提供 DeepSeek 模型的第三方供应商。它**不是**让其他厂商模型（GPT、Gemini、Qwen、GLM 等）获得思考和识图的通用适配器——那些模型的请求方言不同，不在本插件范围内。

```sh
dsh plugin --profile web add github:netease877-lab/dsh-model-map
```

安装后 `dsh web` 重启一次，打开 **设置 → 模型映射**。

## 和同类插件的区别

生态里已有的插件解决的是"档位选择器"——自动补 `reasoningEfforts`、或请求中途改写档位。选择器是出来了，但 DeepSeek 方言的中转站照样可能拒绝请求，识图也依旧关闭。本插件换了个角度：**把官方模型的完整能力声明（正是官方目录自带的那组字段）整体盖到映射模型上**。

| | 档位补齐类插件（autofill / override / 规则） | **dsh-model-map** |
|---|---|---|
| 思考档位可选 | ✔ | ✔（取自官方条目） |
| 线缆方言（`thinking:{type}` + `reasoning_effort`） | ✘ 只管选择器 | ✔ 官方方言；普通 OpenAI 兼容站切 `openai` 风格 |
| 关档发显式 `thinking:{type:"disabled"}` | ✘ | ✔ 与官方请求逐字节同形 |
| 识图准入（`input: [text, image]`） | ✘ 一般不碰 | ✔ |
| 能力事实来源 | 知识库 / 启发式 / 手写 YAML | **运行中 dsh 自己的官方目录** |
| 写死的模型表 | 有时有 | **零写死** |

"零写死"的实际含义：映射下拉吃的是输入框模型选择器同一个会话模型目录 RPC；保存时能力事实（名称/模态/档位）从官方路由现查。**dsh 更新新增或改名官方模型后，下拉和新盖章自动跟进——这类更新永远不需要动本插件。**

线缆对齐不是口号：映射后的请求与官方模型走同一条构造路径（dsh 自家测试钉死的形态）——选思考时 `thinking:{type:"enabled"}, reasoning_effort:"high"`；关思考时只发 `thinking:{type:"disabled"}`，不带 effort 字段。

## 使用

1. 先在官方**模型**页配好第三方供应商（地址 + 密钥 + 模型）。
2. 打开 **设置 → 模型映射**（与「模型 / 插件」同级的一级页面）：
   - **供应商**：第三方路由；
   - **第三方模型**：下拉，列出该供应商自己的模型；
   - **映射到官方模型**：下拉，自动识别的官方全量目录；
   - **参数风格**：`deepseek`（官方方言，转发官方接口的中转站用）；`openai`（纯 `reasoning_effort`，普通 OpenAI 兼容站用；deepseek 风格报 400 就换它）。
3. **保存**即时生效。删除映射只撤回盖章字段，手改过的条目不受影响。

## 工作原理

插件注册 `model-map` 设置区，把每条映射翻译成 `llm-pi-ai` 对应供应商 profile 的能力盖章：`name`、`input`、`reasoningEfforts`、`compat`——正是 pi-ai 物化模型吃的字段，所以模型页、输入框选择器、识图准入、档位菜单全部原生联动。请求仍发你的第三方端点，动的只是能力声明。

浏览器端官方清单走标准会话 `modelCatalog` RPC；保存时宿主侧经 `listModels` + `resolveModelInfo` 现查能力事实。官方目录暂时读不到时映射保持待命，不写编造的值。**刻意不复制**：上下文窗口、最大输出、价格、图片像素预算——这些是你端点自己的事实，保留你自己的配置。

## License

[MIT](./LICENSE)

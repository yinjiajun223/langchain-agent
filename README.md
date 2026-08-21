# LangChain Agent 学习项目

这是一个使用 Node.js、LangChain.js 和兼容 OpenAI API 的模型服务构建的命令行示例项目。代码按学习路径拆分，逐步展示从一次性对话到具备工具调用和结构化输出能力的 Agent。

## 项目内容

| 文件 | 主题 | 说明 |
| --- | --- | --- |
| `src/01-chat.js` | 基础聊天 | 从命令行读取一次输入并调用模型 |
| `src/02-prompt-engineering.js` | 提示词工程 | 读取 `prompts/AGENTS.md` 作为 system prompt |
| `src/03-context-engineering.js` | 上下文工程 | 循环对话，并在历史消息过长时生成摘要 |
| `src/04-structured-output.js` | 结构化输出 | 使用 Zod 约束模型返回的用户信息对象 |
| `src/05-tool-calling.js` | 工具调用 | 注册天气工具，处理一次工具调用并生成最终回复 |
| `src/06-agent-loop.js` | Agent 循环 | 演示 ReAct：思考、调用工具、观察结果并继续循环 |
| `src/07-create-agent.js` | 创建 Agent | 使用 `createAgent`，并返回结构化旅行规划 |
| `src/utils/index.js` | 模型配置 | 创建共享的 `ChatOpenAI` 实例 |
| `src/utils/summary.js` | 消息摘要 | 使用摘要模型压缩早期对话历史 |
| `prompts/AGENTS.md` | 系统提示词 | 示例 system prompt，目前内容为简短回复约束 |

## 环境要求

- Node.js 22.13 或更高版本（满足当前 pnpm 11 的运行要求）
- pnpm 11（项目通过 `package.json` 中的 `devEngines` 声明）
- 一个兼容 OpenAI Chat Completions API 的模型服务

## 安装

```bash
pnpm install
```

在项目根目录创建 `.env`，填写模型服务配置：

```dotenv
AI_API_KEY=your-api-key
AI_BASE_URL=https://your-provider.example.com/v1
AI_MODEL=your-chat-model
```

`.env` 只用于本地配置，不要提交 API Key 或其他凭据。

## 运行示例

`package.json` 中的默认脚本运行基础聊天示例：

```bash
pnpm dev
```

其他示例通过 Node 直接运行：

```bash
pnpm exec node src/02-prompt-engineering.js
pnpm exec node src/03-context-engineering.js
pnpm exec node src/04-structured-output.js
pnpm exec node src/05-tool-calling.js
pnpm exec node src/06-agent-loop.js
pnpm exec node src/07-create-agent.js
```

其中 `03-context-engineering.js`、`06-agent-loop.js` 和 `07-create-agent.js` 会持续或多轮调用模型；按 `Ctrl+C` 可以结束进程。

## 关键实现

### 模型配置

`src/utils/index.js` 集中创建 `ChatOpenAI` 实例，读取 `AI_MODEL`、`AI_BASE_URL` 和 `AI_API_KEY`。示例同时关闭了深度思考参数 `enable_thinking`，实际使用时应根据模型供应商的参数规范调整。

### 上下文摘要

`summaryMessages` 在消息数量达到 12 条时取出最早的 10 条，交给摘要模型压缩，再把摘要作为新的 system message 放回上下文。摘要模型目前固定为 `qwen3.7-plus`，如果服务商不支持该模型，需要修改 `src/utils/summary.js`。

### 工具调用与 Agent

天气工具和 VueConf 城市工具都使用 Zod 定义参数。`06-agent-loop.js` 手动实现工具调用循环；`07-create-agent.js` 使用 LangChain 的 `createAgent` 管理循环，并通过 `travelPlanSchema` 约束最终结果：城市、天气、是否适合出行、原因和注意事项。

## 开发说明

- 示例默认使用 ESM，源码中的 import 路径保留 `.js` 后缀。
- `src/02-prompt-engineering.js` 和 `src/03-context-engineering.js` 使用 `new URL(..., import.meta.url)` 读取提示词文件，可避免从不同工作目录启动时出现路径问题。
- 当前项目没有自动化测试脚本；修改示例后建议至少运行对应入口进行手动验证。
- 工具示例中的天气数据是固定字符串，仅用于演示工具调用流程，不代表真实天气。

## 后续可扩展方向

- 将命令行交互封装为可复用的多轮会话入口。
- 为模型调用、工具执行和摘要过程增加统一的错误处理与日志。
- 将摘要模型名称移入环境变量，并增加消息摘要失败时的降级策略。
- 为工具注册和 Agent 输出增加自动化测试。

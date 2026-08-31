# LangChain Agent 学习项目

这是一个使用 Node.js、LangChain.js、LangGraph 和兼容 OpenAI API 的模型服务构建的命令行示例项目。代码按学习路径拆分，逐步展示基础对话、提示词与上下文工程、工具调用、Agent、持久化记忆、中间件、RAG、MCP、LangGraph 和 Responses API。

## 项目内容

| 文件                            | 主题               | 说明                                                                               |
| ------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| `src/01-chat.js`                | 基础聊天           | 从命令行读取一次输入并调用模型                                                     |
| `src/02-prompt-engineering.js`  | 提示词工程         | 读取 `prompts/AGENTS.md` 作为 system prompt                                        |
| `src/03-context-engineering.js` | 上下文工程         | 循环对话，并在历史消息过长时生成摘要                                               |
| `src/04-structured-output.js`   | 结构化输出         | 使用 Zod 约束模型返回的用户信息对象                                                |
| `src/05-tool-calling.js`        | 工具调用           | 注册天气工具，处理一次工具调用并生成最终回复                                       |
| `src/06-agent-loop.js`          | Agent 循环         | 演示 ReAct：思考、调用工具、观察结果并继续循环                                     |
| `src/07-create-agent.js`        | 创建 Agent         | 使用 `createAgent`，并返回结构化旅行规划                                           |
| `src/08-memory.js`              | 持久化记忆         | 使用 `SqliteSaver` 和固定 `thread_id` 将会话状态保存到 SQLite                      |
| `src/09-middleware.js`          | Agent 中间件       | 演示摘要、工具调用限制、失败重试、人工审核和按角色过滤工具；当前运行权限中间件示例 |
| `src/10-rag.js`                 | 基础 RAG           | 将内置文档向量化后写入内存向量库，检索相关片段并交给模型回答                       |
| `src/11-rag-doc.js`             | 文档 RAG           | 演示 Markdown、PDF 和 Word 的解析、清洗、切片与检索；当前运行 Word 示例            |
| `src/12-rag-agentic.js`         | Agentic RAG        | 将向量检索封装为工具，由 Agent 结合聊天历史自主决定是否检索及检索内容              |
| `src/13-skill.js`               | Agent Skill        | 从 `skills/*/SKILL.md` 的 frontmatter 发现技能，按需加载完整处理流程                |
| `src/14-mcp.js`                 | MCP Client         | 通过 Streamable HTTP 获取本地天气 MCP Server 的工具并交给 Agent                     |
| `mcp/http-server.js`            | MCP HTTP Server    | 提供 `get_weather` 工具，监听 `http://127.0.0.1:3000/mcp`                          |
| `mcp/stdio-server.js`           | MCP stdio Server   | 提供同一天气工具的 stdio 传输实现                                                   |
| `src/15-langgraph.js`           | LangGraph 入门     | 定义状态、节点和边，执行顺序图并生成 `graph.png`                                   |
| `src/16-flow-control.js`        | LangGraph 流程控制 | 用 `Command` 更新状态并按预算分支跳转                                               |
| `src/17-state-hitl.js`          | 状态与人工介入     | 用 `MemorySaver`、`interrupt` 和 `Command.resume` 暂停并恢复审批流程                |
| `src/18-subgraph-and-retry.js`  | 子图与重试         | 保留子图示例；当前执行节点级 `retryPolicy` 重试下单                                 |
| `src/19-responses-api.js`       | Responses API      | 使用 Responses API 绑定内置 `web_search` 工具查询天气                              |
| `src/utils/index.js`            | 模型配置           | 创建共享的 `ChatOpenAI` 实例                                                       |
| `src/utils/summary.js`          | 消息摘要           | 使用摘要模型压缩早期对话历史                                                       |
| `prompts/AGENTS.md`             | 系统提示词         | 示例 system prompt，目前内容为简短回复约束                                         |
| `documents/knowledge.md`        | Agentic RAG 知识库 | 商城商品服务与退货规则示例                                                         |
| `documents/service-rule.*`      | 文档解析素材       | 内容对应的 Markdown、PDF 和 Word 示例文件                                          |

## 环境要求

- Node.js 22.13 或更高版本（满足当前 pnpm 11 的运行要求）
- pnpm 11（项目通过 `package.json` 中的 `devEngines` 声明）
- 一个同时支持聊天模型和 Embeddings 的 OpenAI 兼容模型服务

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

`.env` 只用于本地配置，不要提交 API Key 或其他凭据。RAG 示例当前固定使用 `text-embedding-v4`，配置的服务需要提供该模型或兼容的同名模型。

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
pnpm exec node src/08-memory.js
pnpm exec node src/09-middleware.js
pnpm exec node src/10-rag.js
pnpm exec node src/11-rag-doc.js
pnpm exec node src/12-rag-agentic.js
pnpm exec node src/13-skill.js
pnpm exec node mcp/http-server.js # 在另一个终端保持运行后，再执行下一行
pnpm exec node src/14-mcp.js
pnpm exec node src/15-langgraph.js
pnpm exec node src/16-flow-control.js
pnpm exec node src/17-state-hitl.js
pnpm exec node src/18-subgraph-and-retry.js
pnpm exec node src/19-responses-api.js
```

其中 `03-context-engineering.js`、`06-agent-loop.js` 和 `12-rag-agentic.js` 会持续接收命令行输入，按 `Ctrl+C` 可以结束进程。`17-state-hitl.js` 会等待命令行中的人工审批；`14-mcp.js` 需要先启动 `mcp/http-server.js`。`08-memory.js` 会读写 `data/memory.sqlite`；`10-rag.js` 和 `11-rag-doc.js` 使用源码中预设的问题执行一次检索与回答。`15-langgraph.js` 会在项目根目录生成 `graph.png`。

## 关键实现

### 模型配置

`src/utils/index.js` 集中创建 `ChatOpenAI` 实例，读取 `AI_MODEL`、`AI_BASE_URL` 和 `AI_API_KEY`。示例同时关闭了深度思考参数 `enable_thinking`，实际使用时应根据模型供应商的参数规范调整。

### 上下文摘要

`summaryMessages` 在消息数量达到 12 条时取出最早的 10 条，交给摘要模型压缩，再把摘要作为新的 system message 放回上下文。摘要模型目前固定为 `qwen3.7-plus`，如果服务商不支持该模型，需要修改 `src/utils/summary.js`。

### 工具调用与 Agent

天气工具和 VueConf 城市工具都使用 Zod 定义参数。`06-agent-loop.js` 手动实现工具调用循环；`07-create-agent.js` 使用 LangChain 的 `createAgent` 管理循环，并通过 `travelPlanSchema` 约束最终结果：城市、天气、是否适合出行、原因和注意事项。

### 会话记忆与中间件

`08-memory.js` 使用 `SqliteSaver` 保存 Agent 检查点。使用相同的 `thread_id` 调用时，Agent 可以读取同一会话之前的信息。`09-middleware.js` 保留了多种中间件示例，当前启用的 `PermissionMiddleware` 会根据运行时 `userRole` 过滤工具：普通用户只能查询订单，管理员还可以取消订单。

### RAG

`10-rag.js` 和 `11-rag-doc.js` 使用固定流程完成普通 RAG：加载文档、切片或整理为 `Document`、通过 `OpenAIEmbeddings` 生成向量、写入 `MemoryVectorStore`、检索相关内容，再把检索结果与问题一起交给聊天模型。

`11-rag-doc.js` 同时保留 Markdown、PDF 和 Word 三种解析示例，其中当前启用 Word 路径，使用 Mammoth 提取 `documents/service-rule.docx` 的纯文本。切换解析方式时，需要同步启用对应的加载、切片和 `chunks` 数据。

`12-rag-agentic.js` 将相似度检索封装为 `search_service_rule` 工具。与预先固定检索步骤的普通 RAG 不同，Agent 会结合当前问题和同一会话的历史消息，自主决定是否调用工具以及使用什么检索词。

### Skill 与 MCP

`13-skill.js` 会扫描 `skills` 目录下各个 `SKILL.md` 文件的 frontmatter，将名称和简介提供给客服 Agent；当问题匹配技能时，Agent 通过 `load_skill` 工具读取完整流程。

`14-mcp.js` 使用 `MultiServerMCPClient` 连接本地 HTTP MCP Server，发现 `get_weather` 后交给天气 Agent 调用。当前客户端配置为 HTTP 传输；如需使用 stdio 版本，可在源码中切换对应的 `transport`、`command` 和 `args` 配置。

### LangGraph

`15-langgraph.js` 用 `StateSchema` 定义状态，通过 `START`、节点和 `END` 组成顺序执行图，并使用 `getGraphAsync()` 生成可视化图片。`16-flow-control.js` 在审核节点返回 `Command`，同时写入状态并用 `goto` 选择后续分支。

`17-state-hitl.js` 使用 `MemorySaver` 保存检查点，在 `interrupt()` 处暂停，随后以相同的 `thread_id` 和 `Command.resume` 继续执行。文件顶部还保留了同一线程累积状态的检查点示例。`18-subgraph-and-retry.js` 顶部保留了将身份核验图作为父图节点的子图示例；当前启用的代码为下单节点配置 `retryPolicy.maxAttempts: 2`，模拟首次失败后第二次成功。

### Responses API

`19-responses-api.js` 使用 `ChatOpenAI` 的 `useResponsesApi: true` 切换到 Responses API，并通过 `bindTools` 绑定内置 `web_search` 工具查询杭州天气。文件顶部还保留了 Chat Completions API 和 Responses API 的调用结果、ID 与状态对比示例。运行该示例要求配置的模型服务支持 Responses API 和 `web_search` 工具。

## 开发说明

- 示例默认使用 ESM，源码中的 import 路径保留 `.js` 后缀。
- `src/02-prompt-engineering.js` 和 `src/03-context-engineering.js` 使用 `new URL(..., import.meta.url)` 读取提示词文件，可避免从不同工作目录启动时出现路径问题。
- `src/11-rag-doc.js` 和 `src/12-rag-agentic.js` 使用相对路径读取 `documents`，建议从项目根目录运行。
- `src/13-skill.js` 会读取 `skills` 目录下每个技能的 `SKILL.md`；新增技能时应提供包含 `name` 和 `description` 的 frontmatter。
- `src/14-mcp.js` 默认连接本机 `127.0.0.1:3000`，运行前需启动 `mcp/http-server.js`。示例中的天气数据为固定字符串，仅用于演示 MCP 工具调用流程。
- `src/19-responses-api.js` 会使用模型服务提供的联网搜索能力，回答内容取决于该服务当时返回的搜索结果。
- 当前向量库为 `MemoryVectorStore`，进程结束后向量数据不会持久化；SQLite 仅用于保存 Agent 会话检查点。
- 当前项目没有自动化测试脚本；修改示例后建议至少运行对应入口进行手动验证。
- `src/15-langgraph.js` 会生成 `graph.png`，运行后如不需要可自行删除该产物。

## 后续可扩展方向

- 将聊天模型和 Embeddings 模型配置统一移入环境变量。
- 为模型调用、工具执行和摘要过程增加统一的错误处理与日志。
- 将内存向量库替换为持久化向量数据库，并补充增量更新机制。
- 为工具注册和 Agent 输出增加自动化测试。

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { createAgent } from 'langchain'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { createModel } from './utils/index.js'

config()

// stdio Client 启动子进程时需要 MCP Server 文件的绝对路径。
const mcpServerPath = fileURLToPath(new URL('../mcp/stdio-server.js', import.meta.url))

// 创建 MCP Client，并声明如何启动本地 MCP Server。
const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    // key 可以随便写
    weather: {
      //   transport: 'stdio',
      transport: 'http',
      url: 'http://127.0.0.1:3000/mcp',
      // 使用当前 Node.js 启动 MCP Server。
      //   command: 'node',
      //   args: [mcpServerPath],
    },
  },
})

// 获取 MCP Server 提供的工具。
const tools = await mcpClient.getTools()

console.log(
  '发现的 MCP Tools：',
  tools.map(tool => tool.name)
)

// getTools() 返回的是 LangChain Tool，可以直接交给 Agent。
const agent = createAgent({
  model: createModel(),
  tools,
  systemPrompt: `
      你是一个天气助手。
      用户询问天气时必须调用 get_weather，不要自己猜测天气。
      拿到工具结果以后，再结合用户的问题给出出行建议。
    `,
})

// Agent 会根据问题决定是否调用 get_weather。
const result = await agent.invoke({
  messages: [
    {
      role: 'user',
      content: '杭州今天多少度？适合出去玩吗？',
    },
  ],
})

console.log('\nAI >', result.messages.at(-1).content)

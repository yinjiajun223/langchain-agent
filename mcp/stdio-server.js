// mcp/stdio-server.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({
  name: 'weather-stdio-server',
  version: '1.0.0',
})

// 注册一个 MCP Tool，连接后的 Client 可以发现并调用它
server.registerTool(
  'get_weather',
  {
    description: '查询指定城市今天的天气',
    // 定义调用工具时需要传入的参数，和我们之前搞的那个 tool 工具里面的 schema 是一个意思
    inputSchema: {
      city: z.string().describe('城市名称'),
    },
  },
  async ({ city }) => {
    // stdio 使用 stdout 传输 MCP 数据，所以调试日志写入 stderr
    console.error(`mcp 正在查询天气：${city}`)
    // MCP Tool 通过 content 数组返回结果，因为一些莫名其妙的原因
    return {
      content: [
        {
          type: 'text',
          text: `${city}今天晴，气温 26 度，微风，适合外出。`,
        },
      ],
    }
  }
)

// 子进程与 MCP Client 之间的消息收发器
const transport = new StdioServerTransport()

await server.connect(transport)

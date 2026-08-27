// mcp/http-server.js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { z } from 'zod'

const app = createMcpExpressApp()

app.post('/mcp', async (req, res) => {
  // 无状态模式下，每个请求创建一个新的 MCP Server
  const server = new McpServer({
    name: 'weather-http-server',
    version: '1.0.0',
  })

  server.registerTool(
    'get_weather',
    {
      description: '查询指定城市今天的天气',
      inputSchema: {
        city: z.string().describe('城市名称'),
      },
    },
    async ({ city }) => {
      console.log(`[get_weather] 正在查询天气：${city}`)
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

  // 创建无状态的 Streamable HTTP 通信层
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(3000, '127.0.0.1', () => {
  console.log('天气 MCP Server：http://127.0.0.1:3000/mcp')
})

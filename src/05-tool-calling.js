import { config } from 'dotenv'
import { z } from 'zod'
import { tool } from 'langchain/tools'
import { createModel } from './utils/index.js'

// 加载环境变量
config()

const chatModel = createModel()

function getWeather({ city }) {
  console.log('city ==> 查询天气', city)
  return `${city} 今天晴，气温 26 度`
}

const getWeatherTool = tool(getWeather, {
  name: 'get_weather',
  description: '查询指定城市今天的天气',
  schema: z.object({
    city: z.string().describe('城市名称'),
  }),
})

// 和结构化输出时候的 withStructuredOutput 一样，返回一个实例，这个实例调用的时候会把工具列表传递给模型
const modelWithTools = chatModel.bindTools([getWeatherTool])

const messages = [
  {
    role: 'user',
    content: '杭州今天天气怎么样？适合出去旅游吗？',
  },
]
const aiMessage = await modelWithTools.invoke(messages)
console.log('aiMessage', aiMessage.tool_calls)

messages.push(aiMessage)

const toolCall = aiMessage.tool_calls[0]

const toolRes = await getWeatherTool.invoke(toolCall)

// 将工具调用的结果放到 messages 中
messages.push({
  role: 'tool',
  content: toolRes.content,
  // 注意，这个 id 必须和 aiMessage 中返回的一致，用来让 大模型知道是之前返回的工具调用结果
  tool_call_id: toolRes.tool_call_id,
})

// 重新请求大模型
const res = await modelWithTools.invoke(messages)

// 结合用户问题和工具调用结果输出内容
console.log('AI ==> ', res.content)

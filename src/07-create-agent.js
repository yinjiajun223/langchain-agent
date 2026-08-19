import { config } from 'dotenv'
import { z } from 'zod'
import { tool } from 'langchain/tools'
import { createModel } from './utils/index.js'
import { createAgent, HumanMessage } from 'langchain'
import { ChatPromptTemplate } from '@langchain/core/prompts'
// 加载环境变量
config()

// ChatPromptTemplate.fromMessages([
//   [
//     'system',
//     '你是一个旅行规划助手。根据用户提供的信息帮助用户合理的规划一下出行，注意需要结合天气，景点以及用户的需求合理安排，并且提出出行过程中需要注意的事项',
//   ],
//   ['tool', 'get_vue_conf_city', {}],
//   ['ai', '最近的 VueConf 大会在上海举办'],
//   [
//     'human',
//     '我想参加最近的 VueConf，顺便安排几天旅行。帮我查一下举办城市和当地最近天气，再结合这些信息给我一个出行建议。',
//   ],
// ])

const chatModel = createModel()

// 查询 VueConf 大会所在城市
function getVueConfCity() {
  // 这个不需要参数
  console.log('查询 VueConf 举办城市')
  return '最近的 VueConf 大会在上海举办'
}

function getWeather({ city }) {
  console.log('city ==> 查询天气', city)
  return `${city} 最近晴天，气温 26 度`
}

const getVueConfCityTool = tool(getVueConfCity, {
  name: 'get_vue_conf_city',
  description: '查询最近的 VueConf 大会在哪个城市举办',
  schema: z.object({}),
})

const getWeatherTool = tool(getWeather, {
  name: 'get_weather',
  description: '查询指定城市的天气，只有用户明确提供了城市，或者通过某些确定的工具查询到城市，才可以调用，禁止猜测',
  schema: z.object({
    city: z
      .string()
      .describe('城市名称，只能使用中文，不要臆测参数，如果用户未明确输入，那么只能来自 get_vue_conf_city'),
  }),
})

// // 创建 Agent
// const agent = createAgent({
//   // 把 Agent 使用的模型实例传过去
//   model: chatModel,
//   // 工具
//   tools: [getVueConfCityTool, getWeatherTool],
//   // 系统提示词
//   systemPrompt:
//     '你是一个旅行规划助手。根据用户提供的信息帮助用户合理的规划一下出行，注意需要结合天气，景点以及用户的需求合理安排，并且提出出行过程中需要注意的事项',
// })

// const result = await agent.invoke(
//   {
//     messages: [
//       // SystemMessage('你是一个旅行规划助手。根据用户提供的信息帮助用户合理的规划一下出行，注意需要结合天气，景点以及用户的需求合理安排，并且提出出行过程中需要注意的事项'),
//       // ToolMessage('get_vue_conf_city', {}),
//       // AiMessage('最近的 VueConf 大会在上海举办'),
//       new HumanMessage(
//         '我想参加最近的 VueConf，顺便安排几天旅行。帮我查一下举办城市和当地最近天气，再结合这些信息给我一个出行建议。'
//       ),
//       // {
//       //   role: 'user',
//       //   content:
//       //     '我想参加最近的 VueConf，顺便安排几天旅行。帮我查一下举办城市和当地最近天气，再结合这些信息给我一个出行建议。',
//       // },
//     ],
//   },
//   {
//     // 限制最多干几次
//     recursionLimit: 7,
//   }
// )

// // 注意这里的 result.messages 返回的是一组消息，一般情况下，我们只需要最后一条
// console.log(result.messages.at(-1).content)

// 使用 zod 定义 Agent 最终输出的数据结构
const travelPlanSchema = z.object({
  city: z.string().describe('VueConf 举办城市'),
  weather: z.string().describe('当地天气情况'),
  suitable: z.boolean().describe('是否适合出行'),
  reason: z.string().describe('出行建议'),
  tips: z.array(z.string()).describe('出行注意事项'),
})

const structuredAgent = createAgent({
  model: chatModel,
  tools: [getVueConfCityTool, getWeatherTool],
  systemPrompt:
    '你是一个旅行规划助手。根据用户提供的信息帮助用户合理的规划一下出行，注意需要结合天气，景点以及用户的需求合理安排，并且提出出行过程中需要注意的事项',
  // 结构化输出
  responseFormat: travelPlanSchema,
})

const structuredResult = await structuredAgent.invoke(
  {
    messages: [
      {
        role: 'user',
        content:
          '我想参加最近的 VueConf，顺便安排几天旅行。帮我查一下举办城市和当地最近天气，再结合这些信息给我一个出行建议。',
      },
    ],
  },
  {
    recursionLimit: 7,
  }
)

console.log(structuredResult.structuredResponse)

import { config } from 'dotenv'
import { z } from 'zod'
import { tool } from 'langchain/tools'
import { createModel } from './utils/index.js'

// 加载环境变量
config()

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

// 和结构化输出时候的 withStructuredOutput 一样，返回一个实例，这个实例调用的时候会把工具列表传递给模型
const modelWithTools = chatModel.bindTools([getWeatherTool, getVueConfCityTool])

const messages = [
  {
    role: 'user',
    content:
      '我最近想出去旅游，有可能的话顺便参加一下 VueConf 大会，你帮我查一下大会最近在哪里举办，然后那边天气怎么样？适合旅游吗？',
  },
]

// // -------------------第一轮-------------------------
// // 用户首次发送消息给大模型
// let aiMessage = await modelWithTools.invoke(messages)

// messages.push(aiMessage)

// let toolCall = aiMessage.tool_calls[0]

// let toolRes = await getVueConfCityTool.invoke(toolCall)
// // 保存 VueConf 所在城市结果
// messages.push(toolRes)
// // 模型让我们查询了一下 VueConf 举办城市
// // messages = [用户输入, tool VueConf在上海举办]
// // -------------------第一轮结束 end-------------------------

// // -------------------第二轮-------------------------
// // 问题还没完，还要查询一下 VueConf 所在城市的天气怎么样
// aiMessage = await modelWithTools.invoke(messages)

// messages.push(aiMessage)

// toolCall = aiMessage.tool_calls[0]

// // 调用查询天气的工具
// toolRes = await getWeatherTool.invoke(toolCall)

// messages.push(toolRes)
// // 第二轮结束 messages = [用户输入, tool VueConf在上海举办, 上海天气晴]
// // -------------------第二轮结束 end-------------------------

// // -------------------第三轮-------------------------
// // 根据工具调用返回的结果，大模型响应用户的问题
// // 已知，VueConf 在上海，天气晴，把这些消息连同用户提问的信息一起发送过去
// aiMessage = await modelWithTools.invoke(messages)

// console.log(aiMessage.tool_calls) // 不会在有工具调用的内容
// console.log(aiMessage) // VueConf 在上海，最近天气晴朗，适合旅游玩耍

// // 第二轮结束 messages = [用户输入, tool VueConf在上海举办, tool 上海天气晴, AI 结合所有的信息回复给用户的内容]
// // -------------------第三轮结束 获取到了最终要回复给用户的内容-------------------------

/**
 * 通过 get_vue_conf_city 和 get_weather 找到对应的工具
 */
function findToolByName(name) {
  if (name === 'get_vue_conf_city') {
    // 查询 VueConf 举办城市
    return getVueConfCityTool
  } else if (name === 'get_weather') {
    // 查询天气
    return getWeatherTool
  }
}

while (true) {
  // 给大模型发送消息
  let aiMessage = await modelWithTools.invoke(messages)
  messages.push(aiMessage)

  if (!aiMessage.tool_calls?.length) {
    // 没有工具要调用，表示事情已经做完了，需要响应给用户查看消息
    console.log(aiMessage.content)
    break
  }
  // 有工具需要调用
  let toolCalls = aiMessage.tool_calls
  for (let toolCall of toolCalls) {
    let toolRes = await findToolByName(toolCall.name).invoke(toolCall)
    messages.push(toolRes)
  }
}

// ReAct 是 Reasoning + Acting 的缩写

// 思考 => 执行 => 观测     循环的
// ● Reasoning：模型判断“我接下来需要查什么？”
// ● Acting：模型选择工具，程序执行工具
// ● Observation：工具结果回来以后，再进入下一轮 Reasoning

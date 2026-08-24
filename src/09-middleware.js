// import { config } from 'dotenv'
// import { createAgent, summarizationMiddleware } from 'langchain'
// import { createModel } from './utils/index.js'

// config()

// const chatModel = createModel()

// // 我自己造个比较长的消息，触发摘要压缩
// const messages = [
//   {
//     role: 'user',
//     content: '我叫影，准备去上海旅游，预算是 5000 元，不喜欢赶行程，酒店最好在地铁站附近。',
//   },
//   {
//     role: 'assistant',
//     content: '好的，我记住了你的旅行要求。',
//   },
//   {
//     role: 'user',
//     content: '我准备玩三天。',
//   },
//   {
//     role: 'assistant',
//     content: '好的，我会按照三天安排。',
//   },
//   {
//     role: 'user',
//     content: '第一天想去外滩。',
//   },
//   {
//     role: 'assistant',
//     content: '没问题，第一天可以安排外滩。',
//   },
//   {
//     role: 'user',
//     content: '请根据我前面说的要求，帮我安排这次旅行。',
//   },
// ]

// const agent = createAgent({
//   model: chatModel,
//   systemPrompt: '你是一个旅游规划助手，你得不顾一切的给我来一份合理的旅游规划',
//   middleware: [
//     summarizationMiddleware({
//       // 使用哪个模型生成摘要，注意这里摘要部分，可以使用低级模型，前面讲过了
//       model: chatModel,
//       // 消息达到 6 条以后生成摘要
//       //   trigger: { messages: 6 },
//       trigger: { tokens: 30 },
//       // 最近 2 条消息继续保留原文
//       keep: { messages: 2 },
//       // 告诉摘要模型需要保留哪些重要信息
//       // {messages} 会被 LangChain 替换成需要摘要的历史消息
//       summaryPrompt: `
//         请用中文总结下面的旅游对话。
//         重点保留用户的姓名、预算、目的地、旅行偏好和旅行天数。
//         只输出摘要，不要添加对话中没有的信息。

//         {messages}
//       `,
//       // 摘要的前缀
//       summaryPrefix: '前面对话摘要：',
//     }),
//   ],
// })
// debugger
// const result = await agent.invoke({
//   messages,
// })

// console.log('AI >', result.messages.at(-1).content)

// import { config } from 'dotenv'
// import { z } from 'zod'
// import { tool } from 'langchain/tools'
// import { createAgent, toolCallLimitMiddleware } from 'langchain'
// import { createModel } from './utils/index.js'

// config()

// const chatModel = createModel()

// // 记录天气工具真正执行了多少次
// let weatherCallCount = 0

// function getWeather({ city }) {
//   // 每次真正进入工具函数时，计数器加一
//   weatherCallCount += 1
//   console.log(`第 ${weatherCallCount} 次查询天气：${city}`)

//   // 我随便写着玩的，假装查询天气
//   const weatherMap = new Map([
//     ['上海', '晴，26 度'],
//     ['杭州', '多云，25 度'],
//     ['南京', '小雨，23 度'],
//   ])
//   return `${city}天气：${weatherMap.get(city)}`
// }

// const getWeatherTool = tool(getWeather, {
//   name: 'get_weather',
//   description: '查询指定城市的天气，每个城市需要单独调用一次。',
//   schema: z.object({
//     city: z.string().describe('城市名称'),
//   }),
// })

// // 创建带有工具调用限制中间件的 Agent
// const agent = createAgent({
//   model: chatModel,
//   tools: [getWeatherTool],
//   systemPrompt: `
//     你是一个天气查询助手。
//     用户询问多个城市天气时，每个城市分别调用一次 get_weather。
//     如果工具调用达到上限，不要继续调用，并告诉用户哪些城市没有查询。
//   `,
//   middleware: [
//     toolCallLimitMiddleware({
//       // 限制哪个工具
//       toolName: 'get_weather',
//       // 当前请求最多调用两次
//       runLimit: 2,
//       // 超限后让模型继续完成回复
//       exitBehavior: 'continue',
//     }),
//   ],
// })

// const result = await agent.invoke({
//   messages: [
//     {
//       role: 'user',
//       content: '请分别查询上海、杭州和南京的天气。',
//     },
//   ],
// })

// // 即使模型尝试调用三次，工具也只会真正执行两次
// console.log('\n工具执行次数：', weatherCallCount)
// console.log('\nAI >：', result.messages.at(-1).content)

// import { config } from 'dotenv'
// import { z } from 'zod'
// import { tool } from 'langchain/tools'
// import { createAgent, toolRetryMiddleware } from 'langchain'
// import { createModel } from './utils/index.js'

// config()

// const chatModel = createModel()

// // 工具实际执行了多少次
// let flightCallCount = 0

// function searchFlight({ from, to, date }) {
//   flightCallCount += 1
//   console.log(`第 ${flightCallCount} 次查询航班`)

//   if (flightCallCount === 1) {
//     // 第一次都不太适应，报个错玩玩
//     throw new Error('航班接口暂时超时')
//   }

//   // 第二次调用时正常返回航班信息
//   return `${date} 从${from}飞往${to}的航班为 MU5101，票价 680 元`
// }

// // 查询航班的工具
// const searchFlightTool = tool(searchFlight, {
//   name: 'search_flight',
//   description: '查询指定日期的航班信息，禁止自己猜测航班和票价。',
//   schema: z.object({
//     from: z.string().describe('出发城市'),
//     to: z.string().describe('到达城市'),
//     date: z.string().describe('出发日期'),
//   }),
// })

// const agent = createAgent({
//   model: chatModel,
//   tools: [searchFlightTool],
//   systemPrompt: '你是一个旅游助手。用户询问航班时，必须调用 search_flight。',
//   middleware: [
//     // 搞个重试的中间件玩玩
//     toolRetryMiddleware({
//       // 哪个工具失败后需要重试
//       tools: ['search_flight'],
//       // 第一次失败后再试一次
//       maxRetries: 1,
//     }),
//   ],
// })

// const result = await agent.invoke({
//   messages: [
//     {
//       role: 'user',
//       content: '查询 2026 年 8 月 10 日从上海飞往成都的航班。',
//     },
//   ],
// })

// // 第一次失败、第二次成功，所以这里应该输出 2
// console.log('\n航班工具总执行次数：', flightCallCount)
// console.log('\nAI >', result.messages.at(-1).content)

// import { config } from 'dotenv'
// import { confirm } from '@inquirer/prompts'
// import { z } from 'zod'
// import { tool } from 'langchain/tools'
// import { createAgent, humanInTheLoopMiddleware } from 'langchain'
// import { Command, MemorySaver } from '@langchain/langgraph'
// import { createModel } from './utils/index.js'

// config()

// const chatModel = createModel()

// // 记录酒店预订工具真正执行了多少次
// let bookingCount = 0

// function bookHotel({ hotel, checkIn, nights, totalPrice }) {
//   // 只有人工批准以后，程序才会进入这个函数
//   bookingCount += 1
//   console.log('\n酒店预订工具真正执行了')

//   return `
//     预订成功，订单号 TRAVEL-1001。
//     酒店：${hotel}；
//     入住日期：${checkIn}；
//     入住晚数：${nights} 晚；
//     总价：${totalPrice} 元。
//   `
// }

// const bookHotelTool = tool(bookHotel, {
//   name: 'book_hotel',
//   description: '真正预订酒店并创建订单。',
//   schema: z.object({
//     hotel: z.string().describe('酒店名称'),
//     checkIn: z.string().describe('入住日期'),
//     nights: z.number().describe('入住晚数'),
//     totalPrice: z.number().describe('订单总价'),
//   }),
// })

// const agent = createAgent({
//   model: chatModel,
//   tools: [bookHotelTool],
//   systemPrompt: `
//     你是一个旅游助手。
//     用户提供酒店、入住日期、晚数和总价，帮用户创建订单预定酒店。
//   `,
//   // 注意，如果需要人工干预的时候，这个鸟地方需要保存中间状态
//   checkpointer: new MemorySaver(),
//   middleware: [
//     humanInTheLoopMiddleware({
//       interruptOn: {
//         // 配置哪些工具执行以前需要暂停审核
//         book_hotel: {
//           // 当前案例只允许用户批准或者拒绝
//           allowedDecisions: ['approve', 'reject'],
//           description: '酒店预订会产生费用，请确认是否继续。',
//         },
//       },
//     }),
//   ],
// })

// const threadConfig = {
//   configurable: {
//     thread_id: 'travel-booking-001',
//   },
// }

// // 运行到 book_hotel 前暂停
// const pausedResult = await agent.invoke(
//   {
//     messages: [
//       {
//         role: 'user',
//         content: '帮我预订上海外滩酒店，2026 年 8 月 10 日入住，住 2 晚，总价 1398 元。',
//       },
//     ],
//   },
//   threadConfig
// )

// // __interrupt__ 中保存了这次暂停产生的人工审核信息
// const interruptRequest = pausedResult.__interrupt__?.[0]

// // 当前案例只有一个 book_hotel，所以取第一项
// const actionRequest = interruptRequest?.value.actionRequests[0]

// console.log('待执行工具：', actionRequest)

// // 此时应该是 0，说明酒店预订工具还没有真正执行
// console.log('确认前，预订工具执行次数：', bookingCount)

// // 在命令行中询问用户是否批准本次预订
// const approved = await confirm({
//   message: '是否批准这次酒店预订？',
// })

// const decision = approved ? { type: 'approve' } : { type: 'reject', message: '用户取消了酒店预订。' }

// // 第二次调用：使用相同 thread_id 恢复执行
// const finalResult = await agent.invoke(
//   // Command 用来恢复刚才暂停的 Agent
//   new Command({
//     resume: {
//       // 每一个 actionRequest 都需要一个对应的 decision
//       decisions: [decision],
//     },
//   }),
//   // 恢复时必须继续使用同一个 thread_id
//   threadConfig
// )

// // 批准时应该是 1，拒绝时仍然是 0
// console.log('\n恢复后，预订工具执行次数：', bookingCount)
// console.log('\nAI >', finalResult.messages.at(-1).content)

import { config } from 'dotenv'
import { z } from 'zod'
import { tool } from 'langchain/tools'
import { createAgent, createMiddleware } from 'langchain'
import { createModel } from './utils/index.js'

config()

const chatModel = createModel()

// 普通用户和管理员都可以使用的查询订单工具
const queryBookingTool = tool(
  ({ orderId }) => {
    console.log(`执行查询订单：${orderId}`)
    return `订单 ${orderId} 当前状态：已确认，尚未取消。`
  },
  {
    name: 'query_booking',
    description: '查询旅游订单状态。',
    schema: z.object({
      orderId: z.string().describe('旅游订单号'),
    }),
  }
)

// 只有管理员可以使用的取消订单工具
const cancelBookingTool = tool(
  ({ orderId }) => {
    console.log(`执行取消订单：${orderId}`)
    return `订单 ${orderId} 已成功取消。`
  },
  {
    name: 'cancel_booking',
    description: '取消指定的旅游订单，只有管理员可以使用。',
    schema: z.object({
      orderId: z.string().describe('旅游订单号'),
    }),
  }
)

// 定义每次调用 Agent 时需要传入的运行上下文属性
const contextSchema = z.object({
  userRole: z.enum(['user', 'admin']),
})

// 创建个自定义中间件玩一玩
const permissionMiddleware = createMiddleware({
  name: 'PermissionMiddleware',

  // 声明中间件需要读取的运行信息
  contextSchema,
  // wrapModelCall 会包裹每一次模型调用
  wrapModelCall: (request, handler) => {
    // 从本次调用的 Runtime Context 中读取用户角色
    const userRole = request.runtime.context.userRole

    // 管理员可以看到全部工具
    // 普通用户看不到 cancel_booking
    const tools = userRole === 'admin' ? request.tools : request.tools.filter(tool => tool.name !== 'cancel_booking')

    console.log(`当前角色：${userRole}`)
    console.log(
      '当前角色可以使用的工具：',
      tools.map(tool => tool.name)
    )

    // 把过滤后的工具交给模型，然后继续原来的模型调用
    return handler({
      ...request,
      tools,
    })
  },
})

// 创建带有权限中间件的 Agent
const agent = createAgent({
  model: chatModel,

  // Agent 一开始注册全部工具
  // 中间件会在运行时根据用户角色进行过滤
  tools: [queryBookingTool, cancelBookingTool],

  // Agent 和中间件使用同一份 contextSchema
  contextSchema,
  middleware: [permissionMiddleware],

  systemPrompt: `
    你是一个旅游订单助手。
    只能使用当前提供的工具完成操作。
    如果没有取消订单工具，请明确告诉用户当前角色无权取消订单。
    在工具真正返回成功以前，不得声称订单已经取消。
  `,
})

// 普通用户尝试取消订单
const userResult = await agent.invoke(
  {
    messages: [
      {
        role: 'user',
        content: '请取消旅游订单 TRAVEL-1001。',
      },
    ],
  },
  {
    // 把它理解成运行时的上下文就行
    context: {
      userRole: 'user',
    },
  }
)

console.log('\n普通用户回复：')
console.log(userResult.messages.at(-1).content)

// 管理员执行相同的请求
const adminResult = await agent.invoke(
  {
    messages: [
      {
        role: 'user',
        content: '请取消旅游订单 TRAVEL-1001。',
      },
    ],
  },
  {
    context: {
      userRole: 'admin',
    },
  }
)

console.log('\n管理员回复：', adminResult.messages.at(-1).content)

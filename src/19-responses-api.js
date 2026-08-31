import { ChatOpenAI } from '@langchain/openai'
import { config } from 'dotenv'

// config()

// const commonOptions = {
//   model: process.env.AI_MODEL,
//   configuration: {
//     baseURL: process.env.AI_BASE_URL,
//     apiKey: process.env.AI_API_KEY,
//   },
// }

// // Chat Completions API
// const chatCompletionsModel = new ChatOpenAI({
//   ...commonOptions,
//   useResponsesApi: false,
//   modelKwargs: {
//     enable_thinking: false,
//   },
// })

// // Responses API
// const responsesModel = new ChatOpenAI({
//   ...commonOptions,
//   // 使用 Responses API
//   useResponsesApi: true,
//   modelKwargs: {
//     reasoning: {
//       effort: 'none',
//     },
//   },
// })

// const messages = [
//   {
//     role: 'user',
//     content: '请用一句话解释什么是 Agent',
//   },
// ]

// const chatCompletionsResult = await chatCompletionsModel.invoke(messages)
// const responsesResult = await responsesModel.invoke(messages)

// console.log('Chat Completions API：')
// console.log('回答：', chatCompletionsResult.text)
// console.log('ID：', chatCompletionsResult.id)

// console.log('\nResponses API：')
// console.log('回答：', responsesResult.text)
// console.log('ID：', responsesResult.response_metadata.id)
// console.log('状态：', responsesResult.response_metadata.status)

config()

const responsesModel2 = new ChatOpenAI({
  model: process.env.AI_MODEL,
  useResponsesApi: true,
  modelKwargs: {
    reasoning: {
      effort: 'none',
    },
  },
  configuration: {
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
  },
})

const webSearchModel = responsesModel2.bindTools([
  {
    type: 'web_search',
  },
])

const result = await webSearchModel.invoke('杭州今天天气怎么样？')

console.log('result ==> ', result.text)

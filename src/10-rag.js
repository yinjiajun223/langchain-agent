// import { OpenAIEmbeddings } from '@langchain/openai'
// import { config } from 'dotenv'

// config()

// // 创建向量模型实例
// // 注意：这里要使用 embedding 模型，不是普通聊天模型
// const embeddings = new OpenAIEmbeddings({
//   // qwen3.7-text-embedding 是向量模型，用来把文档和问题转成向量
//   model: 'qwen3.7-text-embedding',
//   // qwen3.7-text-embedding 的 OpenAI 兼容接口单次最多处理 10 条文本
//   batchSize: 10,
//   apiKey: process.env.AI_API_KEY,
//   configuration: {
//     baseURL: process.env.AI_BASE_URL,
//   },
// })

// const vector = await embeddings.embedQuery('猫')
// console.log('vector', vector)

import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { config } from 'dotenv'
import { Document } from '@langchain/classic/document'
import { createModel } from './utils/index.js'

config()

/**
 * 文档碎片，数组中每一项是一个文档
 */
const docs = [
  new Document({
    pageContent: '我老婆喜欢清淡口味，不太能吃辣，不吃香菜，比较喜欢番茄、鸡蛋和虾。',
    metadata: {
      title: '老婆的口味',
    },
  }),
  new Document({
    pageContent: '我个人比较喜欢吃辣的，比较喜欢青椒肉丝，辣椒炒肉，我口味比较重',
    metadata: {
      title: '我自己的口味',
    },
  }),
  new Document({
    pageContent:
      '未使用七天内可以退货，已使用七天内出现质量问题可以退货，十五天内可以换货，如果因为用户个人原因损坏，不予退换货',
    metadata: {
      title: '退货/换货流程',
    },
  }),
]

// 创建向量模型实例
// 注意：这里要使用 embedding 模型，不是普通聊天模型
const embeddings = new OpenAIEmbeddings({
  // text-embedding-v4 是向量模型，用来把文档和问题转成向量
  model: 'text-embedding-v4',
  // text-embedding-v4 的 OpenAI 兼容接口单次最多处理 10 条文本
  batchSize: 10,
  apiKey: process.env.AI_API_KEY,
  configuration: {
    baseURL: process.env.AI_BASE_URL,
  },
})

// 把 docs 中的每一条文档交给 embeddings 转成向量，这个内部自己会实现
// 然后存进 MemoryVectorStore，后面就可以做相似度检索
const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)

// 问题
const question = '我从淘宝买的手机摔了一下，不能用了'

// 调用 similaritySearch 方法检索，第一个参数是问题，第二个参数是你要几条，如果传2，则检索到最相近的两条
const matchedDocs = await vectorStore.similaritySearch(question, 2)
debugger
// 调用 similaritySearchWithScore 方法检索，参数一致，只不过会返回二维数组，第一个是检索到的文档，第二个是相似度
// const matchedDocs = await vectorStore.similaritySearchWithScore(question, 2)

const context = matchedDocs
  .map((doc, index) => {
    return `资料${index + 1}: ${doc.pageContent}`
  })
  .join('\n')

const chatModel = createModel()
const content = `
检索到的资料：
${context}
-----------------
用户问题：${question}
`
const res = await chatModel.invoke([
  {
    role: 'user',
    content,
  },
])

console.log('res.content ==> ', res.content)

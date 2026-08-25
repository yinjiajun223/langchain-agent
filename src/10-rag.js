import { OpenAIEmbeddings } from '@langchain/openai'
import { config } from 'dotenv'

config()

// 创建向量模型实例
// 注意：这里要使用 embedding 模型，不是普通聊天模型
const embeddings = new OpenAIEmbeddings({
  // qwen3.7-text-embedding 是向量模型，用来把文档和问题转成向量
  model: 'qwen3.7-text-embedding',
  // qwen3.7-text-embedding 的 OpenAI 兼容接口单次最多处理 10 条文本
  batchSize: 10,
  apiKey: process.env.AI_API_KEY,
  configuration: {
    baseURL: process.env.AI_BASE_URL,
  },
})

const vector = await embeddings.embedQuery('猫')
console.log('vector', vector)

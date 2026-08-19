import { ChatOpenAI } from '@langchain/openai'

export function createModel() {
  return new ChatOpenAI({
    // 模型名
    model: process.env.AI_MODEL,
    // 额外传递给模型的参数
    modelKwargs: {
      // 关闭深度思考
      enable_thinking: false,
    },
    configuration: {
      // 模型厂商提供的 baseURL
      baseURL: process.env.AI_BASE_URL,
      // 你自己的 API KEY
      apiKey: process.env.AI_API_KEY,
    },
  })
}

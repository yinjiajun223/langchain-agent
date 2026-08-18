import { ChatOpenAI } from '@langchain/openai'
import { config } from 'dotenv'
import { input } from '@inquirer/prompts'

// 加载环境变量
config()

const chatModel = new ChatOpenAI({
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

// 在命令行里输入文本
const content = await input({ message: '你 >' })

// 给模型发送消息
const result = await chatModel.invoke([
  {
    role: 'user',
    // 把命令行里面你叽里呱啦输入的内容发送给大模型
    content: content,
  },
])

console.log(result) // 看到模型叽里呱啦的输出

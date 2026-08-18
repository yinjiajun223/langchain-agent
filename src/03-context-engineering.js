import { ChatOpenAI } from '@langchain/openai'
import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { input } from '@inquirer/prompts'
import { summaryMessages } from './utils/summary.js'

// 这里用 new URL 来获取的原因是不同目录下启动的 node 进程，__dirname 的值不一样，导致路径不对
const systemPrompt = await readFile(new URL('../prompts/AGENTS.md', import.meta.url), 'utf-8')

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

/**
 * 实现了一个简单的循环对话功能，用户可以在命令行中输入内容，模型会根据之前的对话上下文进行回复。
 * 问题：
 * 1、更贵 每一次都会把之前的对话上下文传给模型，导致 token 消耗大，成本高。
 * 2、更慢 每一次都要把之前的对话上下文传给模型，导致响应时间变长。
 * 3、上下文超长  如果对话上下文过长，可能会超过模型的最大 token 限制，导致模型无法处理。
 */

/**
 * 裁剪压缩的弊端
 * 1、上下文丢失  裁剪掉的对话内容可能包含重要信息，导致模型无法理解当前对话的上下文，影响回复的准确性。
 * 2、上下文不连贯  裁剪掉的对话内容可能导致上下文不连贯，模型可能无法理解当前对话的逻辑关系，影响回复的合理性。
 * 3、用户体验差  裁剪掉的对话内容可能导致用户无法看到之前的对话记录，影响用户体验。
 */

let messages = [{ role: 'system', content: systemPrompt }]

while (true) {
  messages = await summaryMessages(messages) // 压缩历史消息，减少 token 消耗

  const content = await input({ message: '你 >', theme: { prefix: '' } })
  messages.push({ role: 'user', content: content })

  // 给模型发送消息
  const result = await chatModel.invoke(messages).catch(err => {
    console.error(err)
    return { content: '模型调用失败，请检查网络或配置' }
  })
  messages.push({ role: 'assistant', content: result.content })

  console.log(result.content) // 看到模型叽里呱啦的输出
}

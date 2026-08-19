import { config } from 'dotenv'
import { readFile } from 'fs/promises'
import { input } from '@inquirer/prompts'
import { createModel } from './utils/index.js'

// 这里用 new URL 来获取的原因是不同目录下启动的 node 进程，__dirname 的值不一样，导致路径不对
const systemPrompt = await readFile(new URL('../prompts/AGENTS.md', import.meta.url), 'utf-8')

// 加载环境变量
config()

const chatModel = createModel()

// 在命令行里输入文本
const content = await input({ message: '你 >' })

// 给模型发送消息
const result = await chatModel.invoke([
  {
    role: 'system',
    content: systemPrompt,
  },
  {
    role: 'user',
    // 把命令行里面你叽里呱啦输入的内容发送给大模型
    content: content,
  },
])

console.log(result.content) // 看到模型叽里呱啦的输出

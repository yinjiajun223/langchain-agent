import { config } from 'dotenv'
import { input } from '@inquirer/prompts'
import { createModel } from './utils/index.js'

// 加载环境变量
config()

const chatModel = createModel()

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

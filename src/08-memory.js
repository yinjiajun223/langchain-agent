import { createAgent } from 'langchain'
import { createModel } from './utils/index.js'
import { config } from 'dotenv'
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite'

config()

// fromConnString 传递的是 Sqlite 文件保存的路径
const checkpointer = SqliteSaver.fromConnString('data/memory.sqlite')
const chatModel = createModel()

const agent = createAgent({
  model: chatModel,
  checkpointer,
})

const threadConfig = {
  configurable: {
    // 会话 ID 注意这里我们的 thread_id 只是随手写的，实际工作中肯定是用的 UUID 或 雪花ID 这种
    thread_id: 'user-1',
  },
}

const aiMessage = await agent.invoke(
  {
    messages: [{ role: 'user', content: '我叫影，喜欢用 JavaScript。' }],
  },
  threadConfig
)

console.log(aiMessage.messages.at(-1).content)

const result = await agent.invoke(
  {
    messages: [{ role: 'user', content: '我喜欢用什么语言？' }],
  },
  threadConfig
)

console.log(result.messages.at(-1).content)

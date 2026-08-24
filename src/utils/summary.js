import { ChatOpenAI } from '@langchain/openai'

export async function summaryMessages(messages) {
  // 历史消息超出 12 条以后才需要摘要压缩
  if (messages.length < 12) {
    return messages
  }
  const summaryModel = new ChatOpenAI({
    // 这个是摘要用的模型，实际工作中肯定是用便宜的模型，因为只是做总结，不是做很复杂的东西
    model: 'qwen3.7-plus',
    configuration: {
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    },
  })

  // 大于 12 条，需要摘要压缩
  // 获取到需要做摘要的旧消息
  const oldMessages = messages.splice(0, 10)

  const summaryMessages = [
    {
      role: 'system',
      content: `
        你是一个专门用于“对话上下文压缩”的摘要助手。
        
        你的任务是：阅读用户和 AI 之前的历史对话，把其中对后续对话仍然有用的信息压缩成一段简洁、准确的摘要。作为模型继续对话时的上下文。
        
        请重点保留以下信息：
        - 用户的身份信息：比如姓名、年龄、职业、背景等。
        - 用户的明确目标：比如正在学习什么、想完成什么任务。
        - 用户的偏好要求：比如喜欢什么表达风格、不喜欢什么回答方式。
        - 已经确认的重要事实：比如前面对话中已经确定的结论、选择、限制条件。
        - 后续可能还会用到的上下文：比如用户刚刚提到但后面可能继续追问的信息。
        
        请删除以下内容：
        - 普通寒暄，比如“你好”“谢谢”“好的”。
        - 重复表达、无关闲聊、临时情绪。
        - 对后续对话没有帮助的细节。
        - AI 回答中的套话、客气话、解释性废话。
        
        输出要求：
        - 用中文输出。
        - 使用简洁的自然语言，不要太长。
        - 不要逐字复述原对话，要提炼关键信息。
        - 不要编造历史对话中没有出现过的信息。
        - 如果某些信息不确定，要写成“不确定”或不要写。
        - 摘要应该能让另一个模型只看摘要，也能理解前面对话的关键背景。
    `,
    },
    {
      role: 'user',
      content: JSON.stringify(oldMessages),
    },
  ]

  // 这里单独调用一次模型，让模型把旧消息压缩成摘要。
  const summaryResult = await summaryModel.invoke(summaryMessages)
  const summary = summaryResult.content

  return [
    {
      role: 'user',
      // 摘要要重新放回 messages，模型下一轮才能看到早期关键信息。
      content: `前面对话摘要：\n${summary}`,
    },
    ...messages,
  ]
}

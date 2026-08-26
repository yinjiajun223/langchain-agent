import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { readFile } from 'node:fs/promises'
import { OpenAIEmbeddings } from '@langchain/openai'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import { createModel } from './utils/index.js'
import { config } from 'dotenv'
import { input } from '@inquirer/prompts'
import { createAgent } from 'langchain'
import { tool } from 'langchain/tools'
import { MemorySaver } from '@langchain/langgraph'
import { z } from 'zod'

config()

//region Markdown 解析

const markdownFile = './documents/knowledge.md'

function normalizePlainText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function loadMarkdownDocs(filePath) {
  const markdown = await readFile(filePath, 'utf8')

  return [
    new Document({
      pageContent: normalizePlainText(markdown),
      metadata: { source: filePath.pathname },
    }),
  ]
}

const rawDocs = await loadMarkdownDocs(markdownFile)

const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
  chunkSize: 160,
  chunkOverlap: 0,
})
const chunks = await splitter.splitDocuments(rawDocs)

// endregion

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-v4',
  batchSize: 10,
  apiKey: process.env.AI_API_KEY,
  configuration: {
    baseURL: process.env.AI_BASE_URL,
  },
})

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings)

const searchServiceRule = tool(
  async ({ query }) => {
    console.log(`\n检索问题：${query}`)

    const matchedDocs = await vectorStore.similaritySearch(query, 3)

    return matchedDocs.map((doc, index) => `资料${index + 1}: ${doc.pageContent}`).join('\n')
  },
  {
    name: 'search_service_rule',
    description: '查询商城的商品服务和退货规则。检索词应结合聊天历史，并尽量包含商品类别',
    schema: z.object({
      query: z.string().describe('要检索的问题'),
    }),
  }
)

const agent = createAgent({
  model: createModel(),
  tools: [searchServiceRule],
  checkpointer: new MemorySaver(),
})

const threadConfig = {
  configurable: {
    thread_id: 'agentic-rag-demo',
  },
}

while (true) {
  const question = await input({ message: '\n你 >', theme: { prefix: '' } })

  // 这里只提需求，具体怎么实现，由全自动的女仆完成
  const result = await agent.invoke(
    {
      messages: [{ role: 'user', content: question }],
    },
    threadConfig
  )

  console.log('\nAI >', result.messages.at(-1).content)
}

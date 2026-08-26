import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { readFile } from 'node:fs/promises'
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'
import { config } from 'dotenv'
import { createModel } from './utils/index.js'
config()

/*  Markdown解析 */
// const markdownFile = './documents/service-rule.md'

// // 只做普通纯文本的基础空白清洗
// function normalizePlainText(text) {
//   return (
//     text
//       .replace(/\r\n?/g, '\n')
//       // 压缩同一行里的连续空格和 tab。
//       .replace(/[ \t]+/g, ' ')
//       // 三个及以上换行压缩成一个空行。
//       .replace(/\n{3,}/g, '\n\n')
//       // 删除整段文本首尾的空白字符。
//       .trim()
//   )
// }

// async function loadMarkdownDocs(filePath) {
//   const markdown = await readFile(filePath, 'utf8')

//   return [
//     new Document({
//       pageContent: normalizePlainText(markdown),
//       metadata: {
//         // 保存到元数据中，留着方便排查
//         source: filePath,
//       },
//     }),
//   ]
// }

// // 加载 + 清洗文档
// const rawDocs = await loadMarkdownDocs(markdownFile)

// // 使用 md 预设拆分器 --> 切片
// const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
//   // 每一片多长
//   chunkSize: 500,
// })

// const chunks = await splitter.splitDocuments(rawDocs)

// 创建向量模型实例
// 注意：这里要使用 embedding 模型，不是普通聊天模型

/* pdf解析 */
// import { PDFParse } from 'pdf-parse'
// // 清理提取结果中的基础空白噪声页眉页码什么的
// function normalizePlainText(text) {
//   return (
//     text
//       .replace(/\r\n?/g, '\n')
//       // 合并同一行内连续的空格和 Tab
//       .replace(/[ \t]+/g, ' ')
//       // 删除页眉
//       .replace(/星河商城服务规范 \| PDF 解析示例/g, '')
//       // 删除页码
//       .replace(/^[ \t]*第[ \t]*\d+[ \t]*页[ \t]*$/gm, '')
//       // 合并空行
//       .replace(/\n{3,}/g, '\n\n')
//       .trim()
//   )
// }

// async function loadPdfDocs(filePath) {
//   const data = await readFile(filePath)
//   const parser = new PDFParse({ data })

//   try {
//     const result = await parser.getText()

//     return result.pages.map(page => {
//       return new Document({
//         // 调用一下清洗的方法，把没用的东西丢掉
//         pageContent: normalizePlainText(page.text),
//         metadata: {
//           documentId: 'service-rule-pdf',
//           source: filePath,
//           page: page.num,
//         },
//       })
//     })
//   } finally {
//     // 释放 PDF parser 占用的资源
//     await parser.destroy()
//   }
// }

// const splitter = new RecursiveCharacterTextSplitter({
//   chunkSize: 200, // 每一片多长
//   chunkOverlap: 80, // 每一片之间重叠多少，避免切片断句 丢失上下文
// })
// const rawPdfDocs = await loadPdfDocs('./documents/service-rule.pdf')
// // source、page 等 metadata 会自动保留到对应的切片中。
// const pdfChunks = await splitter.splitDocuments(rawPdfDocs)

/* word解析 */
import mammoth from 'mammoth'

// 清洗 word
function normalizePlainText(text) {
  return (
    text
      .replace(/\r\n?/g, '\n')
      // 合并同一行内连续的空格和 Tab
      .replace(/[ \t]+/g, ' ')
      // 合并空行
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

async function loadWordDocs(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })

  // 清洗一波
  const text = normalizePlainText(result.value)

  return [
    new Document({
      pageContent: text,
      metadata: {
        documentId: 'service-rule-docx',
        source: filePath,
      },
    }),
  ]
}

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  // chunkOverlap 只是降低信息被切断的概率
  chunkOverlap: 80,
})

const rawWordDocs = await loadWordDocs('./documents/service-rule.docx')
const wordChunks = await splitter.splitDocuments(rawWordDocs)

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
const vectorStore = await MemoryVectorStore.fromDocuments(wordChunks, embeddings)

// 问题
const question = '我要退货'

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

import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { tool } from 'langchain/tools'
import { createAgent } from 'langchain'
import { createModel } from './utils/index.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

config()

const skillsDir = fileURLToPath(new URL('../skills/', import.meta.url))
const entries = await fs.readdir(skillsDir, { withFileTypes: true })
const skills = []

for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const skillPath = path.join(skillsDir, entry.name, 'SKILL.md')
  const raw = await fs.readFile(skillPath, 'utf8')
  const { data } = matter(raw)

  skills.push({
    name: data.name,
    description: data.description,
    path: skillPath,
  })
}
// 获取到所有 skill 的 name
const skillNames = skills.map(skill => skill.name)
// const skills = [
//   {
//     name: 'refund-service',
//     description: '处理商城商品的退货、换货和退款咨询。用户提到退货、换货、退款或询问售后条件时使用。',
//     path: new URL('../skills/refund-service/SKILL.md', import.meta.url),
//   },
//   {
//     name: 'phone-troubleshooting',
//     description: '排查手机无法开机、无法充电、异常发热、无法联网和 SIM 卡异常。用户反馈手机故障时使用。',
//     path: new URL('../skills/phone-troubleshooting/SKILL.md', import.meta.url),
//   },
// ]

const loadSkillTool = tool(
  async ({ skillName }) => {
    console.log(`\n加载 Skill：${skillName}`)

    const skill = skills.find(item => item.name === skillName)

    return readFile(skill.path, 'utf8')
  },
  {
    name: 'load_skill',
    description: '根据名称加载完整的 Skill 工作流程。',
    schema: z.object({
      skillName: z.enum(skillNames).describe('需要加载的 Skill 名称'),
    }),
  }
)

const skillDescriptions = skills.map(skill => `- ${skill.name}：${skill.description}`).join('\n')

const agent = createAgent({
  model: createModel(),
  tools: [loadSkillTool],
  systemPrompt: `
你是一个商城客服助手。

下面是你可以使用的 Skills：

${skillDescriptions}

处理用户问题时遵守下面的规则：

1. 如果问题与一项或多项 Skill 匹配，先调用 load_skill 分别加载需要的完整说明。
2. 不要重复加载当前上下文中已经存在的 Skill。
3. 加载完成后，按照 Skill 中的流程处理问题。
4. 如果没有匹配的 Skill，按照通用规则回答，不要猜测平台政策或业务状态。
5. load_skill 只负责加载说明，不能代表业务操作已经执行。
  `,
})

const question = '我买的手机昨天刚到，还没有激活，现在不想要了，可以退货吗？'
// const question = '我的手机插上充电器没有反应，应该怎么排查？'

console.log('\n你 >', question)

const result = await agent.invoke({
  messages: [{ role: 'user', content: question }],
})

console.log('\nAI >', result.messages.at(-1).content)

import { config } from 'dotenv'
import { z } from 'zod'
import { createModel } from './utils/index.js'

// 加载环境变量
config()

const chatModel = createModel()

// const userInfo = await chatModel.invoke(
//   [
//     {
//       role: 'system',
//       content: '你负责从用户输入中提取用户信息，以 JSON 的形式输出给我',
//     },
//     {
//       role: 'user',
//       content: '我叫张三，今年 18 岁，在北京',
//     },
//   ],
//   {
//     response_format: {
//       // 使用 JSON Schema 模式，而不是普通文本或简单 JSON mode
//       type: 'json_schema',

//       // 定义本次结构化输出的 schema
//       json_schema: {
//         // 这个 schema 的名字，方便模型理解当前输出结构的用途
//         name: 'user_info',
//         // 标准 JSON Schema，描述模型最终应该输出的数据结构
//         schema: {
//           // 输出必须是一个对象
//           type: 'object',

//           // 对象中允许出现的字段
//           properties: {
//             name: {
//               type: 'string',
//               description: '用户名',
//             },
//             age: {
//               type: 'integer',
//               description: '用户的年龄',
//               minimum: 1,
//             },
//             city: {
//               type: 'string',
//               description: '所在城市',
//             },
//           },

//           // 这些字段都是必填项
//           required: ['name', 'age', 'city'],
//         },
//       },
//     },
//   }
// )

// const userInfo = await chatModel.invoke(
//   [
//     {
//       role: 'system',
//       content: '你负责从用户输入中提取用户信息，以 JSON 的形式输出给我',
//     },
//     {
//       role: 'user',
//       content: '我叫张三，今年 18 岁，在北京',
//     },
//   ],
//   {
//     response_format: {
//       // 使用 JSON Schema 模式，而不是普通文本或简单 JSON mode
//       type: 'json_schema',

//       // 定义本次结构化输出的 schema
//       json_schema: {
//         // 这个 schema 的名字，方便模型理解当前输出结构的用途
//         name: 'user_info',
//         // 使用 zod
//         schema: z.object({
//           // 用户名：必须是 string 类型
//           name: z.string().describe('用户名'),
//           // 用户年龄：必须是 number、整数，并且 >= 1
//           age: z.number().int().min(1).describe('用户的年龄'),
//           // 所在城市：必须是 string 类型
//           city: z.string().describe('所在城市'),
//         }),
//       },
//     },
//   }
// )
// console.log(JSON.parse(userInfo.content))

// 使用 zod 定义结构化输出的 schema
const userInfoSchema = z.object({
  // 用户名：必须是 string 类型
  name: z.string().describe('用户名'),

  // 用户年龄：必须是 number、整数，并且 >= 1
  age: z.number().int().min(1).describe('用户的年龄'),

  // 所在城市：必须是 string 类型
  city: z.string().describe('所在城市'),
})

// 基于原始模型创建一个结构化输出模型
const structuredModel = chatModel.withStructuredOutput(userInfoSchema, {
  // schema 的名字
  name: 'user_info',
  // 这个属性，其实就是 response_format 的 type = json_schema
  method: 'jsonSchema',
})

const userInfo = await structuredModel.invoke([
  {
    role: 'system',
    content: '你负责从用户输入中提取用户信息，以 JSON 的形式输出给我',
  },
  {
    role: 'user',
    content: '我叫张三，今年 18 岁，在北京',
  },
])

console.log(userInfo) // 它可以直接返回对象格式，不需要 JSON.parse

import { START, END, StateGraph, StateSchema } from '@langchain/langgraph'
import { z } from 'zod/v4'
import { writeFile } from 'node:fs/promises'
// 定义图中使用的状态
const state = new StateSchema({
  input: z.number().default(0),
  value: z.number(),
  result: z.string(),
})

// ----- 下面的是节点函数 -----
// 输入先加 1，结果放到 value。
function node1(state) {
  console.log('node1')
  return {
    value: state.input + 1,
  }
}

// 接着把 value 乘 2。
function node2(state) {
  console.log('node2')
  return {
    value: state.value * 2,
  }
}

// 最后把数字整理成返回文本。
function node3(state) {
  console.log('node3')
  return {
    result: `最终结果是 ${state.value}`,
  }
}

// 创建一个图构建器
const builder = new StateGraph(state)

// 添加节点
builder.addNode('node1', node1)
builder.addNode('node2', node2)
builder.addNode('node3', node3)

// 添加边
// 从 node1 开始。
builder.addEdge(START, 'node1')
// node1 算完接着跑 node2。
builder.addEdge('node1', 'node2')
// node2 算完接着跑 node3。
builder.addEdge('node2', 'node3')
// node3 跑完，流程结束。
builder.addEdge('node3', END)

// 编译成图
const graph = builder.compile()

//region 生成可绘制的图
// 获取可绘制的图
const drawableGraph = await graph.getGraphAsync()

// 生成 PNG
const image = await drawableGraph.drawMermaidPng()
const imageBuffer = new Uint8Array(await image.arrayBuffer())

// 把图片写入到文件中
await writeFile('graph.png', imageBuffer)
//endregion

// 执行这个图
const result = await graph.invoke({
  input: 3,
})

console.log(result)

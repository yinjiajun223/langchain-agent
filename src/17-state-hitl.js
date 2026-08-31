// import { END, MemorySaver, START, StateGraph, StateSchema } from '@langchain/langgraph'
// import { z } from 'zod/v4'

// const State = new StateSchema({
//   // 每次执行从 0 开始
//   count: z.number().default(0),
// })

// function inc(state) {
//   return {
//     // 每次 + 1
//     count: state.count + 1,
//   }
// }

// const builder = new StateGraph(State)

// // 添加节点
// builder.addNode('inc', inc)
// // 添加边
// builder.addEdge(START, 'inc')
// builder.addEdge('inc', END)

// const graph = builder.compile({
//   checkpointer: new MemorySaver(),
// })

// // 相同的 thread_id 指向同一份历史数据
// const thread = {
//   configurable: {
//     thread_id: 'hello',
//   },
// }

// // 第一次执行：0 + 1 = 1
// const firstResult = await graph.invoke({}, thread)

// console.log(firstResult.count) // 1

// // 继续使用同一个 thread_id，所以会在上一次的结果上加 1，1 + 1 = 2
// const secondResult = await graph.invoke({}, thread)
// console.log(secondResult.count) // 2

// // 换成新的 thread_id，不会读取上一个线程的状态。
// const anotherThread = await graph.invoke(
//   {},
//   {
//     configurable: {
//       thread_id: 'HelloWorld',
//     },
//   }
// )
// console.log(anotherThread.count)

import { confirm } from '@inquirer/prompts'
import { Command, END, MemorySaver, START, StateGraph, StateSchema, interrupt } from '@langchain/langgraph'
import { z } from 'zod/v4'

const State = new StateSchema({
  // 键盘价格
  price: z.number(),
  // 结果
  result: z.string(),
})

// 先暂停等审批，恢复后再处理审批结果。
function requestApproval(state) {
  // 第一次执行到这里时，图会暂停。
  const decision = interrupt({
    question: `可以买这把 ${state.price} 元的新键盘吗？`,
    price: state.price,
  })

  return {
    result: decision.approved ? `申请通过，${state.price} 元键盘已经下单。` : '买个鸡毛键盘，还不如给我买个丝袜呢',
  }
}

const builder = new StateGraph(State)

// 添加节点
builder.addNode('request_approval', requestApproval)

// 添加边
// 一开始就提交购买申请。
builder.addEdge(START, 'request_approval')
// 审批结果处理完后结束。
builder.addEdge('request_approval', END)

const graph = builder.compile({
  // 没有检查点，暂停后就没法接着恢复。
  checkpointer: new MemorySaver(),
})

const config = {
  configurable: {
    thread_id: 'keyboard-purchase-1',
  },
}

const pausedResult = await graph.invoke({ price: 399 }, config)

console.log(pausedResult.__interrupt__[0].value)

const approved = await confirm({
  message: pausedResult.__interrupt__[0].value.question,
  default: false,
})

// 把人工选择传给 interrupt()，恢复同一个线程。
const finalResult = await graph.invoke(
  new Command({
    resume: {
      approved,
    },
  }),
  config
)

console.log(finalResult.result)

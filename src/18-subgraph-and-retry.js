// import { END, START, StateGraph, StateSchema } from '@langchain/langgraph'
// import { z } from 'zod/v4'

// const HotelCheckInState = new StateSchema({
//   guestName: z.string(),
//   status: z.string(),
// })

// // 检查客人是否出示了身份证原件。
// function checkIdCard(state) {
//   return {
//     status: `${state.status} -> 身份证原件已检查`,
//   }
// }

// // 再核验身份证信息是否有效。
// function verifyIdentity(state) {
//   return {
//     status: `${state.status} -> 身份证信息核验通过`,
//   }
// }

// //region 子图
// // 把每次办理入住时都要执行的身份检查封装成子图。
// const identityCheckBuilder = new StateGraph(HotelCheckInState)

// // 添加子图节点
// identityCheckBuilder.addNode('check_id_card', checkIdCard)
// identityCheckBuilder.addNode('verify_identity', verifyIdentity)

// // 添加子图的边
// identityCheckBuilder.addEdge(START, 'check_id_card')
// identityCheckBuilder.addEdge('check_id_card', 'verify_identity')
// identityCheckBuilder.addEdge('verify_identity', END)

// const identityCheckGraph = identityCheckBuilder.compile()
// //endregion

// // 先根据老登的姓名创建一个入住状态
// function prepareCheckIn(state) {
//   return {
//     status: `正在为 ${state.guestName} 办理入住`,
//   }
// }

// const hotelCheckInBuilder = new StateGraph(HotelCheckInState)

// // 给他爹添加节点
// hotelCheckInBuilder.addNode('prepare_check_in', prepareCheckIn)
// // 注意，这里把子图也当做了一个节点 identityCheckGraph
// hotelCheckInBuilder.addNode('check_identity', identityCheckGraph)

// // 给他爹添加边
// hotelCheckInBuilder.addEdge(START, 'prepare_check_in')
// hotelCheckInBuilder.addEdge('prepare_check_in', 'check_identity')
// hotelCheckInBuilder.addEdge('check_identity', END)

// const hotelCheckInGraph = hotelCheckInBuilder.compile()

// const result = await hotelCheckInGraph.invoke({
//   guestName: '张三',
// })

// console.log(result.status)

/* 重试 */
import { END, START, StateGraph, StateSchema } from '@langchain/langgraph'
import { z } from 'zod/v4'

const State = new StateSchema({
  model: z.string(),
  result: z.string(),
})

let attempts = 0

// 模拟一次临时故障，第二次调用才下单成功。
function placeOrder(state) {
  attempts += 1

  if (attempts < 2) {
    throw new Error('商城系统繁忙')
  }

  return {
    result: `第 ${attempts} 次下单成功，${state.model} 正在发货`,
  }
}

const builder = new StateGraph(State)

// 添加节点
builder.addNode('place_order', placeOrder, {
  retryPolicy: {
    // 包含第一次执行，最多尝试两次。
    maxAttempts: 2,
  },
})

// 添加边 直接下单
builder.addEdge(START, 'place_order')
// 下完单就结束
builder.addEdge('place_order', END)

const graph = builder.compile()

const result = await graph.invoke({
  model: '雷蛇键盘',
})

console.log(result.result)

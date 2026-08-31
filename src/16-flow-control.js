import { Command, END, START, StateGraph, StateSchema } from '@langchain/langgraph'
import { z } from 'zod/v4'

const State = new StateSchema({
  price: z.number(),
  result: z.string(),
  action: z.string(),
})

// 审核购买请求，同时用 Command 写入结果并决定下一步。
function reviewRequest(state) {
  // 预算不超过 500 元。
  const canBuy = state.price <= 500

  if (canBuy) {
    // 预算通过，跳转到下单流程。
    return new Command({
      update: {
        result: '预算通过。',
      },
      goto: 'place_keyboard_order',
    })
  }
  // 完犊子，不给买
  return new Command({
    update: {
      result: '申请未通过，建议先把现有键盘用明白。',
    },
    goto: 'buy_stockings',
  })
}

// 审批通过后走这里。
function placeKeyboardOrder() {
  return {
    action: '键盘已经下单。',
  }
}

// 审批没通过则走这里。
function buyStockings() {
  return {
    action: '买个鸡毛键盘，还不如给我买个丝袜呢',
  }
}

const builder = new StateGraph(State)

// 添加节点
builder.addNode('review_request', reviewRequest, {
  // 把 Command 可能跳到的节点提前声明出来。
  ends: ['place_keyboard_order', 'buy_stockings'],
})
builder.addNode('place_keyboard_order', placeKeyboardOrder)
builder.addNode('buy_stockings', buyStockings)

// 添加边
// 先审核购买申请。
builder.addEdge(START, 'review_request')
// 下一步由 Command.goto 决定，所以 review_request 不再单独连边。
// 下单分支跑完就结束。
builder.addEdge('place_keyboard_order', END)
// 买丝袜分支跑完也结束。
builder.addEdge('buy_stockings', END)

const graph = builder.compile()

const result = await graph.invoke({
  price: 399,
})

console.log(result.result)
console.log(result.action)

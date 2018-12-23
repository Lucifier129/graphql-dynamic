const { createContext } = require('../util')

const atMap = (ctx, next) => {
  ctx.directive('map', createMap(ctx))
  return next()
}

const createMap = ctx => async params => {
  if (typeof ctx.createFunction !== 'function') {
    throw new Error(`ctx.createFunction is not a function in @map`)
  }

  let result = ctx.result

  if (result == null) {
    return
  }

  let { to: code, ...rest } = params

  if (typeof code !== 'string') {
    ctx.error(
      `\`to\` in @map should be a string of expresstion, instead of ${code}`
    )
    return
  }

  let isArray = Array.isArray(result)
  let map = ctx.createFunction(code, '$value', '$index', '$list', '$parent')

  result = isArray ? result : [result]

  result = result.map((item, index, list) => {
    let context = {
      fetch: ctx.fetch,
      get: ctx.get,
      post: ctx.post,
      getAll: ctx.getAll,
      postAll: ctx.postAll,
      ...ctx.rootValue,
      [ctx.fieldName]: item,
      [ctx.info.resultKey]: item,
      ...item,
      ...rest
    }
    return map(context, item, index, list, ctx.rootValue)
  })

  result = await Promise.all(result)
  ctx.result = isArray ? result : result[0]
}

atMap.createMap = createMap
module.exports = atMap

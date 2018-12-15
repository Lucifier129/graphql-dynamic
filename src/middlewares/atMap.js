const { createContext } = require('../util')

const atMap = (ctx, next) => {
  ctx.directive('map', createMap(ctx))
  return next()
}

const createMap = ctx => params => {
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
  let map = ctx.createFunction(code, '$value', '$index', '$list')

  result = isArray ? result : [result]

  result = result.map((item, index, list) => {
    let context = createContext(rest, item, ctx.fieldName)
    return map(context, item, index, list)
  })

  ctx.result = isArray ? result : result[0]
}

atMap.createMap = createMap
module.exports = atMap

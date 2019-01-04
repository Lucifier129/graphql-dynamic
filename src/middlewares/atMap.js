const atMap = (ctx, next) => {
  ctx.directive('map', createMap(ctx))
  return next()
}

const createMap = ctx => async params => {
  if (typeof ctx.createFunction !== 'function') {
    throw new Error(`ctx.createFunction is not a function in @map`)
  }

  let result = ctx.result

  if (result == null) return

  let { to: code, ...rest } = params

  if (typeof code !== 'string') {
    ctx.error(
      `\`to\` in @map should be a string of expresstion, instead of ${code}`
    )
    return
  }

  let isArray = Array.isArray(result)
  let map = ctx.createFunction(code, '$value', '$index')

  result = isArray ? result : [result]

  let mapItem = (item, index) => {
    if (item == null) return item
    if (Array.isArray(item)) return item.map(mapItem)
    
    let context = {
      ...ctx.rootValue,
      [ctx.fieldName]: item,
      [ctx.info.resultKey]: item,
      ...item,
      ...rest
    }
    return map.call(context, item, index)
  }

  result = result.map(mapItem)

  ctx.result = isArray ? result : result[0]
}

atMap.createMap = createMap
module.exports = atMap

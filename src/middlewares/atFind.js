const atFind = (ctx, next) => {
  ctx.directive('find', createFind(ctx))
  return next()
}

const createFind = ctx => params => {
  if (typeof ctx.createFunction !== 'function') {
    throw new Error(`ctx.createFunction is not a function in @map`)
  }

  let result = ctx.result

  if (result == null) return

  let { if: code, ...rest } = params

  if (typeof code !== 'string') {
    ctx.error(
      `\`if\` in @find should be a string of expresstion, instead of ${code}`
    )
    return
  }

  let predicate = ctx.createFunction(code, '$value', '$index')
  let predicateItem = (item, index) => {
    if (item == null) return false
    if (Array.isArray(item)) return item.find(predicateItem)

    let context = {
      ...ctx.rootValue,
      [ctx.fieldName]: item,
      [ctx.info.resultKey]: item,
      ...item,
      ...rest
    }
    return predicate.call(context, item, index)
  }
  
  result = Array.isArray(result) ? result : [result]
  ctx.result = result.find(predicateItem)
}

atFind.createFind = createFind
module.exports = atFind
